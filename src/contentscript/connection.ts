import { IPubSub } from "./types"
import { State } from './state';

type Key = string | number | symbol
type MsgFilter = string | Promise<string> | ((op: any, msg: any) => boolean)
export type EventDef<T extends Key> = { [key in T]: MsgFilter }
type MsgHandler = ((op: string, msg: any) => void)
type EventHandler = { [key in Key]: MsgHandler[] | MsgHandler }

interface IDappletApi { [name: string]: any }

export type AutoProperty = {
    name: string
    set: (setter: (value: any) => void) => void
}

export type Listener = { f?: MsgFilter, h?: EventHandler | IDappletApi, p: AutoProperty[] }

const ANY_EVENT: any = Symbol('any_event')

export interface IConnection {
    open(id?: string): Promise<any>
    send(op: any, msg?: any): Promise<any>
    sendAndListen(topic: string, message: any, h: MsgHandler | EventHandler): this
    declare(dappletApi: IDappletApi): this
    listen(h: MsgHandler | EventHandler): this
}

export class Connection<T> implements IConnection {
    public state: State<T>
    private readonly _listeners = new Set<Listener>()
    private readonly _listenerContextMap = new Map<string, Listener>();

    constructor(
        private _bus?: IPubSub,
        private _eventDef?: EventDef<any>
    ) {
        this._bus?.onMessage((operation, message) => this.onMessage(operation, message));
    }

    open(id?: string) {
        this._bus.exec('getDefaultState', this.state.defaultState);
        this._bus.exec('changeState', this.state.getAll());
        return this._bus.exec('onOpen', id);
    }

    // op - operation, subject
    // msg - payload
    send(op: any, msg?: any) { // should return promise
        if (
          this.state !== undefined
          && this.state.getAll !== undefined
          && this.state.type !== 'server'
          && this._bus?.registered
        ) {
          this._bus.exec('changeState', this.state.getAll());
        }
        if (op === 'changeState' && msg === undefined) return;
        return this._bus.exec(op, msg)
    }

    sendAndListen(topic: string, message: any, h: MsgHandler | EventHandler): this {
        let listener = this.listener("", h as any);
        listener.f = this.send(topic, message);
        return this;
    }

    /**
     * @deprecated Since version 0.46.1. Will be deleted in version 0.50.0. Use declare instead.
     */
    listen(h: MsgHandler | EventHandler): this {
        console.warn('DEPRECATED: "listen" method of the Connection class is deprecated since version 0.46.1. Will be deleted in version 0.50.0. Use "declare" instead');
        this.listener("", h as any);
        return this;
    }

    declare(dappletApi: IDappletApi): this {
        const msgFilter = dappletApi.constructor?.name !== 'Object' ? 'dappletApiClass' :'dappletApi';
        this.listener(msgFilter, dappletApi as any);
        return this;
    }

    // call, when new context was created.
    private listener(): Listener
    private listener(h: EventHandler): Listener
    private listener(f: MsgFilter): Listener
    private listener(f: MsgFilter, h: MsgHandler): Listener
    private listener(f: MsgFilter, h: EventHandler): Listener
    private listener(f: MsgFilter, h: IDappletApi): Listener
    private listener(filterOrHander?: MsgFilter | EventHandler, evtOrMsgOrApiOrAP?: EventHandler | MsgHandler | IDappletApi | AutoProperty[]): Listener {
        let listener: Listener

        if (filterOrHander === undefined) {
            listener = { f: undefined, h: undefined, p: [] }
        } else if (typeof filterOrHander === 'object' && !filterOrHander.then) { //is an EventHandler
            listener = { f: undefined, h: filterOrHander as EventHandler, p: [] }
        } else if (typeof filterOrHander === 'object') { // is an Promise
            listener = { f: filterOrHander as Promise<string>, h: undefined, p: [] }
        } else if (evtOrMsgOrApiOrAP instanceof Array) {
            listener = { f: filterOrHander, h: undefined, p: evtOrMsgOrApiOrAP || [] }
        } else if (typeof evtOrMsgOrApiOrAP == 'function') {
            listener = { f: filterOrHander, h: { [ANY_EVENT]: evtOrMsgOrApiOrAP }, p: [] }
        } else {
            listener = { f: filterOrHander, h: evtOrMsgOrApiOrAP!, p: [] }
        }

        this._listeners.add(listener)
        return listener
    }

    private _topicMatch(topic: string, pattern: string): boolean {
        if (!pattern || pattern == topic) {
            return true
        } else if (!topic) {
            return false
        } else {
            const expected = pattern.split('.')
            const actual = topic.split('.')

            if (expected.length > actual.length) {
                return false
            }
    
            for (let i = 0; i < actual.length; ++i) {
                if (actual[i] != expected[i] && expected[i] != "*") {
                    return false
                }
            }
    
            return true
        }        
    }
    
    public subscribeToObservable(id: string, key: string, setter: (v: any) => void) {
        let listener = this._listenerContextMap.get(id);

        if (!listener) {
            listener = this.listener();

            const handler = (evt: any) => {
                if (evt.data.operation === "destroy") {
                    const subId = typeof listener.f === "string" ? listener.f : undefined;

                    if (subId !== undefined) {
                        this.send("unsubscribe", subId);
                    }
                    
                    this._listeners.delete(listener);
                    this._listenerContextMap.delete(id);
                    window.removeEventListener(id, handler);
                }
            };

            window.addEventListener(id, handler);
            this._listenerContextMap.set(id, listener);
            this.send("subscribe", { id })
                .then((id) => (listener.f = id));
        }

        let ap = {
            name: key,
            value: undefined,
            set: (v: any) => {
                ap.value = v;
                setter(v);
            },
        };

        listener.p.push(ap);
    }

    onMessage(op: any, msg: any): void {
        try {
            const isTopicMatch = (op: any, msg: any, f: MsgFilter) =>
                typeof f === 'function' ? f(op, msg) : this._topicMatch(op, f as string);

            if (msg.type === 'changeState') {
                const [newStateData, id] = msg.message;
                this.state.set(newStateData, id);
                this._bus.exec('changeState', this.state.getAll());
                return;
            }

            this._listeners.forEach(async (listener) => {
                if (typeof listener.f === 'object' && listener.f.then) {
                    listener.f = await listener.f;
                }
                
                if (!listener.f || listener.f === 'dappletApi' || listener.f === 'dappletApiClass' || isTopicMatch(op, msg, listener.f)) {
                    if (listener.h) {
                        const getAllApiNames = (dappletApi: any) => {
                            const props: string[] = [];
                            let obj = dappletApi;
                            do {
                                props.push(...Object.getOwnPropertyNames(obj));
                            } while (obj = Object.getPrototypeOf(obj));
                            const allApiClassNames = props.filter((e, i, arr) => e != arr[i + 1] && typeof dappletApi[e] == 'function');
                            const objBaseMethods = ['__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];
                            return allApiClassNames.filter((apiName) => !objBaseMethods.includes(apiName));
                        }

                        const eventsIds = listener.f === 'dappletApiClass' ? [ ...getAllApiNames(listener.h), ANY_EVENT] : [...Object.keys(listener.h), ANY_EVENT];
                        if ((listener.f === 'dappletApi' || listener.f === 'dappletApiClass') && !eventsIds.includes(msg?.type)) {
                            this.send(`${msg?.type}_undone`, `${msg?.type} does not exist`);
                            return;
                        };
                        for (const eventId of eventsIds) {
                            const cond = this._eventDef ? this._eventDef[eventId] : eventId;
                            //ToDo: extract msg.type default
                            if ((typeof cond === 'function' ? cond(op, msg) : msg?.type == cond) || eventId === ANY_EVENT) {
                                const handlers = listener.h[eventId]
                                if (!handlers) continue;
                                
                                if (Array.isArray(handlers)) {
                                    handlers.forEach(h => h(op, msg));
                                } else if (listener.f === 'dappletApi' || listener.f === 'dappletApiClass') {
                                    try {
                                        const res = await (<Object>listener.h)[eventId](...msg.message);
                                        this.send(`${msg?.type}_done`, res);
                                    } catch (err) {
                                        this.send(`${msg?.type}_undone`, `${err.message} ${err.stack}`);
                                    }
                                } else {
                                    handlers(op, msg);
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
        } catch (err) {
            console.error(err);
        }
    }
}