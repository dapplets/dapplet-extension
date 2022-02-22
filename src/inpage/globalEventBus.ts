import { JsonRpc } from "../common/jsonrpc";
import { GLOBAL_EVENT_BUS_NAME } from "../common/chrome-extension-websocket-wrapper/constants";

export class GlobalEventBus {
    private _listeners: { [event: string]: ((...args: any[]) => void)[] } = {};

    constructor(private _jsonRpc: JsonRpc) {
        _jsonRpc.on(GLOBAL_EVENT_BUS_NAME, (e, args) => {
            this._emitLocal(e, args);
            return true;
        });
    }

    public on(event: string, callback: (...args: any[]) => void) {
        if (!this._listeners.hasOwnProperty(event)) {
            this._listeners[event] = [];
        }

        this._listeners[event].push(callback);

        return this;
    }

    public off(event: string, callback: (...args: any[]) => void) {
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
    }

    private _emitExternal(event: string, ...args: any[]) {
        this._jsonRpc.call(GLOBAL_EVENT_BUS_NAME, [event, args]);
    }

    private _emitLocal(event: string, ...args: any[]) {
        if (!this._listeners.hasOwnProperty(event)) {
            return null;
        }

        const callbacks = this._listeners[event];

        for (let i = 0; i < callbacks.length; i++) {
            const callback = callbacks[i];

            callback.call(this, ...args);
        }
    }

    destroy() {
        this._listeners = {};
    }
}