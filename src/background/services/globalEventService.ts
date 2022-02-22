import { GLOBAL_EVENT_BUS_NAME } from "../../common/chrome-extension-websocket-wrapper/constants";

export class GlobalEventService {
    private _listeners: { [event: string]: ((...args: any[]) => void)[] } = {};
    private _ports: any[] = [];

    public createConnectListener() {
        return (port: any) => {
            if (port.name === GLOBAL_EVENT_BUS_NAME) {
                this._ports.push(port);

                port.onMessage.addListener((message: { event: string, args: string }) => {
                    this._emitExternal(port, message.event, ...message.args);
                    this._emitLocal(message.event, ...message.args);
                });

                port.onDisconnect.addListener(() => {
                    const index = this._ports.indexOf(port);
                    if (index !== -1) {
                        this._ports.splice(index, 1);
                    }
                });
            }
        }
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
        this._emitExternal(null, event, ...args);
        this._emitLocal(event, ...args);
    }

    private _emitExternal(exclude: any | null, event: string, ...args: any[]) {
        for (let i = 0; i < this._ports.length; i++) {
            const port = this._ports[i];
            if (port !== null && exclude === port) continue;
            port.postMessage({ event, args });
        }
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
}