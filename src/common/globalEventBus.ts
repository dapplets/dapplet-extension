import { browser } from "webextension-polyfill-ts";
import { GLOBAL_EVENT_BUS_NAME } from "./chrome-extension-websocket-wrapper/constants";

const ALL_EVENTS = Symbol('ALL_EVENTS');

export class GlobalEventBus {
    private _listeners: { [event: string | symbol]: ((...args: any[]) => void)[] } = {};

    constructor(private _port: any = browser.runtime.connect({ name: GLOBAL_EVENT_BUS_NAME } as any)) {
        _port.onMessage.addListener((message: { event: string, args: any[] }) => {
            this._emitLocal(message.event, ...message.args);
            this._emitAll(message.event, ...message.args);
        });
    }

    public on(event: string, callback: (...args: any[]) => void) {
        if (!this._listeners.hasOwnProperty(event)) {
            this._listeners[event] = [];
        }

        this._listeners[event].push(callback);

        return this;
    }

    public off(event: string | symbol, callback: (...args: any[]) => void) {
        if (!this._listeners.hasOwnProperty(event) || this._listeners[event].length === 0) {
            return this;
        }

        const index = this._listeners[event].indexOf(callback);

        if (index === -1) {
            return this;
        }

        this._listeners[event].splice(index, 1);

        return this;
    }

    public emit(event: string, ...args: any[]) {
        this._emitExternal(event, ...args);
        this._emitLocal(event, ...args);
        this._emitAll(event, ...args);
    }

    public emitExceptAll(event: string, ...args: any[]) {
        this._emitExternal(event, ...args);
        this._emitLocal(event, ...args);
    }

    public onAll(callback: (event: string, ...args: any[]) => void) {
        if (!this._listeners.hasOwnProperty(ALL_EVENTS)) {
            this._listeners[ALL_EVENTS] = [];
        }

        this._listeners[ALL_EVENTS].push(callback);

        return this;
    }

    public offAll(callback: (event: string, ...args: any[]) => void) {
        return this.off(ALL_EVENTS, callback);
    }

    public destroy() {
        this._listeners = {};
    }

    private _emitExternal(event: string, ...args: any[]) {
        this._port.postMessage({ event, args });
    }

    private _emitLocal(event: string, ...args: any[]) {
        if (this._listeners.hasOwnProperty(event)) {
            const callbacks = this._listeners[event];
            for (let i = 0; i < callbacks.length; i++) {
                const callback = callbacks[i];
                callback.call(this, ...args);
            }
        }
    }

    private _emitAll(event: string, ...args: any[]) {
        if (this._listeners.hasOwnProperty(ALL_EVENTS)) {
            const callbacks = this._listeners[ALL_EVENTS];
            for (let i = 0; i < callbacks.length; i++) {
                const callback = callbacks[i];
                callback.call(this, event, ...args);
            }
        }
    }
}