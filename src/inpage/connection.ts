import { IPubSub } from "./types"

type Key = string | number | symbol
type MsgFilter = string | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler[] | MsgHandler }
export type AutoProperty = {
    conn: IConnection
    name: string
    set: (setter: (value: any) => void) => void
}
class AutoPropertyConf {
    public idx = 0
    constructor(public name: Key, public conn: Connection) { }
}

export type AutoProperties<M> = { [key in keyof M]: AutoProperty }
type Listener = { f?: MsgFilter, h?: EventHandler, p: AutoProperty[] }

const ANY_EVENT: any = Symbol('any_event')
const TYPE_FILTER = (type: string) => (op: any, msg: any) => msg.type === type

type EventType = {
    operation: string, // 'create'
    // maybe better data structure or naming?
    contextType: string, // 'tweet'
    contextId: string,  // '123123123' tweet Id  
    context: any           // this is the Context; for example parsed TWEET objext
}

export interface IConnection {
    readonly listeners: Map<Key, Listener>
    send(op: any, msg: any): Promise<any>
    sendAndListen(e: EventType): void
    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listener(h: EventHandler): Key
    listener(f: MsgFilter, ap?: AutoProperty[]): Key
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): Key
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): Key
    addAutoProperties(f: MsgFilter, ap: AutoProperty[]): Key
    topicMatch(topic: string, pattern: string): boolean
    onMessage(op: any, msg: any): void
    subscribe(topic: string, message: any, h: MsgHandler | EventHandler): this
}

export class Connection implements IConnection {
    private _ctxListenerMap = new WeakMap<any, Listener>()
    private autoProperties = new Map<Key, AutoProperty>()
    public readonly listeners = new Map<Key, Listener>()
    private nn = 0 //a numeric handle counter to address listeners and autopropertes

    constructor(
        private _bus?: IPubSub,
        private eventDef?: EventDef<any>
    ) {
        this._bus?.onMessage((operation, message) => {
            this.onMessage(operation, message);
        })
    }

    // op - operation, subject
    // msg - payload
    send(op: any, msg: any) { // should return promise
        return this._bus.exec(op, msg)
    }

    sendAndListen = (e: EventType) => {
        let listenerId: any
        let subscriptionId = undefined;

        if (e.operation == 'create') {
            if (!e.context.connToListenerMap) // ToDo: remove
                e.context.connToListenerMap = new WeakMap<Connection, Listener>()

            listenerId = this.listener((op) => op === subscriptionId);
            let listener = this.listeners.get(listenerId)
            e.context.connToListenerMap.set(this, listener) // ToDo: remove      // a WeakMap
            this._ctxListenerMap.set(e.context, listener);
        } else if (e.operation == 'destroy') {
            this.listeners.delete(listenerId)
            e.context.connToListenerMap.delete(this) // ToDo: remove      // maybe unnecessary
            this._ctxListenerMap.delete(e.context);
        } else
            throw Error()

        //message to server to switch the subscription on/off
        //exact format is to be adjusted
        this.send(e.operation + "_" + e.contextType, { id: e.contextId })
            .then(id => subscriptionId = id);
    }

    subscribe(topic: string, message: any, h: MsgHandler | EventHandler): this {
        this.send(topic, message).then(subId => {
            this.listen(subId, h as any);
        });
        return this;
    }

    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listen(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): this {
        this.listener.call(this, arguments)
        return this
    }

    // call, when new context was created.
    listener(h: EventHandler): Key
    listener(f: MsgFilter, ap?: AutoProperty[]): Key
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): Key
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): Key
    listener(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): Key {
        if (typeof filterOrHander === 'object') { //is an EventHandler
            this.listeners.set(++this.nn, { f: undefined, h: filterOrHander, p: [] })
        } else {
            if (evtOrMsgOrAP instanceof Array) {
                this.listeners.set(++this.nn, { f: filterOrHander, h: undefined, p: evtOrMsgOrAP || [] })
            } else if (typeof evtOrMsgOrAP == 'function') {
                let h = { [ANY_EVENT]: evtOrMsgOrAP }
                this.listeners.set(++this.nn, { f: filterOrHander, h: h, p: ap || [] })
            } else {
                this.listeners.set(++this.nn, { f: filterOrHander, h: evtOrMsgOrAP!, p: ap || [] })
            }
        }
        return this.nn
    }

    //connection with AutoProperty support added by proxy
    static create<M>(_bus: IPubSub, eventsDef?: EventDef<any>): AutoProperties<M> & Connection {
        return new Proxy(new Connection(_bus, eventsDef), {
            get(target: any, prop: string, receiver) {
                if (prop in target) return target[prop]

                const autoProperty = {
                    conn: target,
                    name: prop,
                    lastValue: undefined,
                    activate: (context: any, setter: (value: any) => void) => {
                        const listener = target._ctxListenerMap.get(context);
                        listener.p.push({
                            name: prop, 
                            set: (value: any) => {
                                autoProperty.lastValue = value; // ToDo: bug! it seems, that it overrides foreign autoprops
                                setter(value);
                            }
                        });
                    },
                    deactivate: (context: any) => {
                        const listener = target._ctxListenerMap.get(context);
                        console.log('ToDo: need to implement deactivation'); // ToDo: need to implement deactivation
                    }
                }

                return autoProperty
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
        if (!pattern || pattern == topic) return true
        else if (!topic) return false

        let expected = pattern.split('.')
        let actual = topic.split('.')
        if (expected.length > actual.length) return false

        for (let i = 0; i < actual.length; ++i) {
            if (actual[i] != expected[i] && expected[i] != "*")
                return false
        }
        return true
    }

    onMessage(op: any, msg: any, nn?: Key): void {
        const isTopicMatch = (op: any, msg: any, f: MsgFilter) =>
            typeof f === 'string' ? this.topicMatch(op, f) : f(op, msg)

        const listeners = nn ? [this.listeners.get(nn)] : this.listeners

        listeners.forEach((listener) => {
            if (!listener.f || isTopicMatch(op, msg, listener.f)) {
                if (listener.h) {
                    for (let eventId of [...Object.keys(listener.h), ANY_EVENT]) {
                        let cond = this.eventDef ? this.eventDef[eventId] : eventId
                        //ToDo: extract msg.type default
                        if ((typeof cond === 'function' ? cond(op, msg) : msg.type == cond) || eventId === ANY_EVENT) {
                            const handlers = listener.h[eventId]
                            if (Array.isArray(handlers)) {
                                handlers.forEach(h => h(op, msg))
                            } else {
                                handlers(op, msg)
                            }
                        }
                    }
                }
                //push values to autoProperties
                for (let ap of listener.p || []) {
                    ap && msg[ap.name] !== undefined && ap.set(msg[ap.name])
                }
            }
        })
        // ToDo: is it necessary?
        //push values to autoProperties
        for (let ap of this.autoProperties.values()) {
            ap && msg[ap.name] && ap.set(msg[ap.name])
        }
    }
}