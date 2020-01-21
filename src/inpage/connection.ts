import { PubSubRpc } from "./pubSubRpc"
import { IPubSub } from "./types"

type Key = string | number | symbol
type MsgFilter = string | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler[] | MsgHandler }
export type AutoProperty = {
    name: string
    set: (ctx: any, setter: (value: any) => void) => void
}
// class AutoPropertyConf {
//     public idx = 0
//     constructor(public name: Key, public conn: Connection) { }
// }

export type AutoProperties<M> = { [key in keyof M]: AutoProperty }
type Listener = { f?: MsgFilter, h?: EventHandler, p?: AutoProperty[] }

const ANY_EVENT: any = Symbol('any_event')
const TYPE_FILTER = (type: string) => (op: any, msg: any) => msg.type === type

export interface IConnection {
    readonly listeners: Map<number, Listener>;
    send(op: any, msg: any): Promise<any>;
    subscribe(topic: string, message?: any): number;
    listen(h: EventHandler): this;
    listen(f: MsgFilter, ap?: AutoProperty[]): this;
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this;
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this;
    listener(h: EventHandler): number;
    listener(f: MsgFilter, ap?: AutoProperty[]): number;
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): number;
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): number;
    unsubscribe(nn: number): void;
    addAutoProperties(f: MsgFilter, ap: AutoProperty[]): number;
    topicMatch(topic: string, pattern: string): boolean;
    onMessage(op: any, msg: any): void;
    get(key: any): number;
    set(key: any, value: any): void;
}

export class Connection implements IConnection {
    private _ctxNNmap = new WeakMap<any, number>();
    private _nnSubscriptionMap = new Map<number, any>();
    private autoProperties = new Map<number, AutoProperty>()
    public readonly listeners = new Map<number, Listener>()
    private nn = 0 //a numeric handle counter to address listeners and autopropertes

    constructor(
        private _bus?: IPubSub,
        private eventDef?: EventDef<any>        
    ) {}

    // op - operation, subject
    // msg - payload
    send(op: any, msg: any) { // should return promise
        return this._bus.exec(op, msg);
    }

    subscribe(topic: string, message?: any): number {
        const nn = this.listener(topic); // topic === tweetInfo
        const subscription = this._bus.subscribe(topic, [message], (result) => {
            this.onMessage(topic, result, nn);
        });
        this._nnSubscriptionMap.set(nn, subscription);
        return nn;
    }

    listen(h: EventHandler): this
    listen(f: MsgFilter, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): this
    listen(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): this
    listen(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): this {
        this.listener.call(this, arguments);
        return this;
    }

    // call, when new context was created.
    listener(h: EventHandler): number
    listener(f: MsgFilter, ap?: AutoProperty[]): number
    listener(f: MsgFilter, h: MsgHandler, ap?: AutoProperty[]): number
    listener(f: MsgFilter, h: EventHandler, ap?: AutoProperty[]): number
    listener(filterOrHander: MsgFilter | EventHandler, evtOrMsgOrAP?: EventHandler | MsgHandler | AutoProperty[], ap?: AutoProperty[]): number {
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
        return this.nn;
    }

    unsubscribe(nn: number) {
        this.listeners.delete(nn);
        this._nnSubscriptionMap.get(nn).unsubscribe();
    }

    //connection with AutoProperty support added by proxy
    static create<M>(_bus: IPubSub, eventsDef?: EventDef<any>): AutoProperties<M> & Connection {
        const conn = new Connection(_bus, eventsDef);
        return new Proxy(conn, {
            get(target: any, prop, receiver) {
                //let idx: number = 0

                if (prop in target) return target[prop];

                const autoProperty: AutoProperty = {
                    name: prop as string,
                    set: (ctx: any, setter: (value: any) => void) => {
                        const nn = target.get(ctx);
                        const listener = target.listeners.get(nn);
                        if (!listener.h) listener.h = { [ANY_EVENT]: [] };
                        listener.h[ANY_EVENT].push((op, msg) => setter(msg[prop]));
                    }
                }

                return autoProperty;
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

    onMessage(op: any, msg: any, nn?: number): void {
        const isTopicMatch = (op: any, msg: any, f: MsgFilter) =>
            typeof f === 'string' ? this.topicMatch(op, f) : f(op, msg)

        const listeners = nn ? [this.listeners.get(nn)] : this.listeners;

        listeners.forEach((listener) => {
            if (!listener.f || isTopicMatch(op, msg, listener.f)) {
                if (listener.h) {
                    for (let eventId of [...Object.keys(listener.h), ANY_EVENT]) {
                        let cond = this.eventDef ? this.eventDef[eventId] : eventId
                        //ToDo: extract msg.type default
                        if (typeof cond === 'function' ? cond(op, msg) : msg.type == cond) {
                            const handlers = listener.h[eventId];
                            if (Array.isArray(handlers)) {
                                handlers.forEach(h => h(op, msg))
                            } else {
                                handlers(op, msg)
                            }
                        }
                        if (eventId === ANY_EVENT) {
                            const handlers = listener.h[eventId];
                            if (Array.isArray(handlers)) {
                                handlers.forEach(h => h(op, msg))
                            } else {
                                handlers(op, msg)
                            }
                        }
                    }
                }
                //push values to autoProperties
                // for (let ap of listener.p || []) {
                //     ap && msg[ap.name] && ap.set(msg[ap.name])
                // }
            }
        })
        //push values to autoProperties
        // for (let ap of this.autoProperties.values()) {
        //     ap && msg[ap.name] && ap.set(msg[ap.name])
        // }
    }

    get(key: any): number {
        return this._ctxNNmap.get(key);
    }

    set(key: any, value: any): void {
        this._ctxNNmap.set(key, value);
    }
}