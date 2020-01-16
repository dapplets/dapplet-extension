type Key = string | number | symbol
type MsgFilter = string | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler }
type AutoProperty = {
    name: string
    set: (value: any) => void
}
export type AutoProperties<M> = { [key in keyof M]: AutoProperty }
type Listener = { f?: MsgFilter, h?: EventHandler, p?: AutoProperty[] }

const PROP = 'auto_property'
const ANY_EVENT = 'any_event'
const TYPE_FILTER = (type: string) => (op: any, msg: any) => msg.type === type

export class Connection {
    public listeners: Listener[] = []
    private autoProperties = new Map<number, AutoProperty>()

    constructor(
        private _send: (op: any, msg: any) => void,
        private eventDef?: EventDef<any>
    ) { }

    send(op: any, msg: any): this {
        this._send(op, msg);
        return this
    }

    receive(buf: any): this {
        // make connection dependend work
        //let { op, msg } = parseMessage(buf) 
        let op, msg
        this.onMessage(op, msg)
        return this
    }

    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listen(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): this {
        if (typeof filterOrHander === 'object') { //is an EventHandler
            this.listeners.push({ f: undefined, h: filterOrHander })
        } else {
            let _h, _p
            if (evtOrMsgOrAP instanceof Array) {
                this.listeners.push({ f: filterOrHander, h: undefined, p: evtOrMsgOrAP })
            } else if (typeof evtOrMsgOrAP == 'function') {
                let h = { [ANY_EVENT]: evtOrMsgOrAP }
                this.listeners.push({ f: filterOrHander, h: h, p: ap })
            } else {
                this.listeners.push({ f: filterOrHander, h: evtOrMsgOrAP!, p: ap })
            }
        }
        return this
    }

    //connection with AutoProperty support added by proxy
    static create<M>(_send: (op: any, msg: any) => void, eventsDef?: EventDef<any>): AutoProperties<M> & Connection {
        return new Proxy(new Connection(_send, eventsDef), {
            get(conn: any, name, receiver) {
                let idx: number = 0
                return name in conn ? conn[name] : ({
                    [PROP]: Object.defineProperty({
                        conn: conn,
                        name: name,
                        idx: 0
                    }, 'set', {
                        // if setter set, activate autoProp
                        set: function (setter) {
                            if (idx > 0) conn.autoProperties.delete(idx)
                            if (setter) idx = conn.addAutoProperty(name, setter)
                            else idx = 0
                            return true
                        }
                    })
                })
            }
        })
    }

    private apNum = 0
    private addAutoProperty(name: string, setter: (v: any) => void): number {
        this.autoProperties.set(++this.apNum, { name: name, set: setter })
        return this.apNum
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
                    console.log(ap)
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