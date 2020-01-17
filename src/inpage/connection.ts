type Key = string | number | symbol
type MsgFilter = string | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler }
type AutoProperty = {
    name: string
    set: (value: any) => void
}
class AutoPropertyConf {
    public idx = 0
    constructor(public name: Key, public conn: Connection) { }
}

export type AutoProperties<M> = { [key in keyof M]: AutoProperty }
type Listener = { f?: MsgFilter, h?: EventHandler, p?: AutoProperty[] }

const ANY_EVENT: any = Symbol('any_event')
const TYPE_FILTER = (type: string) => (op: any, msg: any) => msg.type === type

export interface IConnection {
    readonly listeners: Map<number, Listener>;
    send(op: any, msg: any): this;
    listen(h: EventHandler): this;
    listen(f: MsgFilter, ap?: AutoProperty[]): this;
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this;
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this;
    addAutoProperties(f: MsgFilter, ap: AutoProperty[]): number;
    topicMatch(topic: string, pattern: string): boolean;
    onMessage(op: any, msg: any): void;
}

export class Connection implements IConnection {
    private autoProperties = new Map<number, AutoProperty>()
    public readonly listeners = new Map<number, Listener>()
    private nn = 0 //a numeric handle counter to address listeners and autopropertes

    constructor(
        private _send: (op: any, msg: any) => void,
        private eventDef?: EventDef<any>
    ) { }

    send(op: any, msg: any): this {
        this._send(op, msg);
        return this
    }

    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listen(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): this {
        if (typeof filterOrHander === 'object') { //is an EventHandler
            this.listeners.set(++this.nn, { f: undefined, h: filterOrHander })
        } else {
            if (evtOrMsgOrAP instanceof Array) {
                this.listeners.set(++this.nn, { f: filterOrHander, h: undefined, p: evtOrMsgOrAP })
            } else if (typeof evtOrMsgOrAP == 'function') {
                let h = { [ANY_EVENT]: evtOrMsgOrAP }
                this.listeners.set(++this.nn, { f: filterOrHander, h: h, p: ap })
            } else {
                this.listeners.set(++this.nn, { f: filterOrHander, h: evtOrMsgOrAP!, p: ap })
            }
        }
        return this
    }

    //connection with AutoProperty support added by proxy
    static create<M>(_send: (op: any, msg: any) => void, eventsDef?: EventDef<any>): AutoProperties<M> & Connection {
        return new Proxy(new Connection(_send, eventsDef), {
            get(conn: any, name, receiver) {
                let idx: number = 0
                return name in conn ? conn[name] :
                    Object.defineProperty(
                        new AutoPropertyConf(name, conn),
                        'set', {
                        // if setter set, activate autoProp
                        set: function (setter) {
                            if (idx > 0) conn.autoProperties.delete(idx)
                            if (setter) idx = conn.addAutoProperty({ name: name, set: setter })
                            else idx = 0
                            return true
                        }
                    })
            }
        })
    }

    private addAutoProperty(ap: AutoProperty): number {
        this.autoProperties.set(++this.nn, ap)
        return this.nn
    }

    public addAutoProperties(f: MsgFilter, ap: AutoProperty[]): number {
        this.listeners.set(++this.nn, { f: f, h: undefined, p: ap })
        return this.nn
    }

    topicMatch(topic: string, pattern: string): boolean {
        if (!pattern || pattern == topic) return true;
        else if (!topic) return false;

        let expected = pattern.split('.')
        let actual = topic.split('.')
        if (expected.length > actual.length) return false

        for (let i = 0; i < actual.length; ++i) {
            if (actual[i] != expected[i] && expected[i] != "*")
                return false
        }
        return true
    }

    onMessage(op: any, msg: any): void {
        console.log(`onmessage op: ${op}, msg:`, msg);
        const isTopicMatch = (op: any, msg: any, f: MsgFilter) =>
            typeof f === 'string' ? this.topicMatch(op, f) : f(op, msg)
        this.listeners.forEach((listener) => {
            if (!listener.f || isTopicMatch(op, msg, listener.f)) {
                if (listener.h) {
                    for (let eventId of Object.keys(listener.h)) {
                        let cond = this.eventDef ? this.eventDef[eventId] : eventId
                        //ToDo: extract msg.type default
                        if (typeof cond === 'function' ? cond(op, msg) : msg.type == cond) {
                            listener.h[eventId](op, msg)
                        }
                    }
                    listener.h[ANY_EVENT]?.(op, msg)
                }
                //push values to autoProperties
                for (let ap of listener.p || []) {
                    ap && msg[ap.name] && ap.set(msg[ap.name])
                }
            }
        })
        //push values to autoProperties
        for (let ap of this.autoProperties.values()) {
            ap && msg[ap.name] && ap.set(msg[ap.name])
        }
    }
}