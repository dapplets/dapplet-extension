import { IPubSub } from "./types"

type Key = string | number | symbol
type MsgFilter = string | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler[] | MsgHandler }
export type AutoProperty = {
    name: string
    set: (setter: (value: any) => void) => void
}

type AutoPropertyConf = {
    name: string
    conn: Connection
}

export type AutoProperties<M> = { [key in keyof M]: AutoProperty }
export type Listener = { f?: MsgFilter, h?: EventHandler, p: AutoProperty[] }

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
    readonly listeners: Set<Listener>
    send(op: any, msg?: any): Promise<any>
    bind(e: EventType): Listener
    sendAndListen(topic: string, message: any, h: MsgHandler | EventHandler): this
    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listener(h: EventHandler): Listener
    listener(f: MsgFilter, ap?: AutoProperty[]): Listener
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): Listener
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): Listener
    topicMatch(topic: string, pattern: string): boolean
    onMessage(op: any, msg: any): void
}

export class Connection implements IConnection {
    private autoProperties = new Map<Key, AutoProperty>()
    public readonly listeners = new Set<Listener>()

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
    send(op: any, msg?: any) { // should return promise
        return this._bus.exec(op, msg)
    }

    bind(e: EventType): Listener {
        let listener 
        let subscriptionId = undefined;
        if (e.operation == 'create') {
            if (!e.context.connToListenerMap) // ToDo: maybe move WeakMap from Context to Connection class
                e.context.connToListenerMap = new WeakMap<Connection, Listener>()
            listener = this.listener((op) => op === subscriptionId);
            e.context.connToListenerMap.set(this, listener) // ToDo: remove      // a WeakMap
        } else if (e.operation == 'destroy') {
            //assumption: one listener per connection in context
            listener = e.context.connToListenerMap.delete(this) // ToDo: remove      // maybe unnecessary
            this.listeners.delete(listener) //ToDo: how to cleanup?
        } else {
            throw Error()
        }
        //message to server to switch the subscription on/off
        //exact format is to be adjusted
        this.send(e.operation + "_" + e.contextType, { id: e.contextId })
            .then(id => listener.f = id);
        return listener    
    }
    
    sendAndListen(topic: string, message: any, h: MsgHandler | EventHandler, ap?: AutoProperty[]): this {
        //Decision Choice 1: 
        // create listener first and setup the filter for given subscription id later
        let listener = this.listener("", h as any, ap)
        this.send(topic, message).then(subId => listener.f = subId);
        //Decision Choice 2: 
        // create listener later as the server replies with the subscription id
        //this.send(topic, message).then(subId => this.listen(subId, h as any, ap));
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
    listener(h: EventHandler): Listener
    listener(f: MsgFilter, ap?: AutoProperty[]): Listener
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): Listener
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): Listener
    listener(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): Listener {
        let listener:Listener
        if (typeof filterOrHander === 'object') { //is an EventHandler
            listener = { f: undefined,      h: filterOrHander, p: [] }
        } else if (evtOrMsgOrAP instanceof Array) {
            listener = { f: filterOrHander, h: undefined,      p: evtOrMsgOrAP || [] }
        } else if (typeof evtOrMsgOrAP == 'function') {
            listener = { f: filterOrHander, h: { [ANY_EVENT]: evtOrMsgOrAP }, p: ap || [] }
        } else {
            listener = { f: filterOrHander, h: evtOrMsgOrAP!,  p: ap || [] }
        }
        console.log('listener>', listener)
        this.listeners.add(listener)
        return listener
    }

    //connection with AutoProperty support added by proxy
    static create<M>(_bus: IPubSub, eventsDef?: EventDef<any>): AutoProperties<M> & Connection {
        return new Proxy(new Connection(_bus, eventsDef), {
            //ToDo: this is an old code. verify Autoproperty creation 
            get(target: any, prop: string, receiver) {
                return prop in target ? target[prop] : {
                    conn: target,
                    name: prop,
                } as AutoPropertyConf 
            }
        })
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

    onMessage(op: any, msg: any): void {
        try {
            console.log('connection -> onMessage: op, msg', op, msg);
            const isTopicMatch = (op: any, msg: any, f: MsgFilter) =>
                typeof f === 'string' ? this.topicMatch(op, f) : f(op, msg)

            this.listeners.forEach((listener) => {
                if (!listener.f || isTopicMatch(op, msg, listener.f)) {
                    if (listener.h) {
                        for (let eventId of [...Object.keys(listener.h), ANY_EVENT]) {
                            let cond = this.eventDef ? this.eventDef[eventId] : eventId
                            //ToDo: extract msg.type default
                            if ((typeof cond === 'function' ? cond(op, msg) : msg.type == cond) || eventId === ANY_EVENT) {
                                const handlers = listener.h[eventId]
                                console.log('handlers', handlers);
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
        } catch (err) {
            console.error(err);
        }
    }
}