import { browser } from 'webextension-polyfill-ts';
import { MESSAGE_BUS_NAME } from './constants'

export default class WebSocketProxyClient {
    private _port;
    private _isMsgBusConnected: boolean = false;
    private _eventTarget = new EventTarget();
    public readyState: number = WebSocket.CONNECTING;

    constructor(url: string) {
        this._port = browser.runtime.connect(undefined, { name: MESSAGE_BUS_NAME });
        this.url = url;
        this._isMsgBusConnected = true;

        this._port.postMessage({ event: 'connect', data: url });

        this._port.onMessage.addListener((message: { data: string, event: string }) => {
            if (message.event == 'message') {
                const e = new MessageEvent('message', { data: message.data });
                this._eventTarget.dispatchEvent(e);
            }
            else if (message.event == 'open') {
                this.readyState = WebSocket.OPEN;
                const e = new CustomEvent('open');
                this._eventTarget.dispatchEvent(e);
            }
            else if (message.event == 'error') {
                const e = new CustomEvent('error');
                this._eventTarget.dispatchEvent(e);
            }
        });

        this._port.onDisconnect.addListener(() => {
            this._isMsgBusConnected = false;
            this.readyState = WebSocket.CLOSED;
            const e = new CustomEvent('close');
            this._eventTarget.dispatchEvent(e);
        });
    }

    public readonly url: string;
    
    public close(): void {
        if (this._isMsgBusConnected) {
            this._port.disconnect();
        }
    }

    public send(data: string): void {
        if (this._isMsgBusConnected) {
            this._port.postMessage({ data: data, event: 'message' });
        } else {
            throw new Error("Connection closed.");
        }
    }

    public addEventListener(event: string, listener: (e: MessageEvent) => void) {
        this._eventTarget.addEventListener(event, listener);
    }

    public removeEventListener(event: string, listener: (e: MessageEvent) => void) {
        this._eventTarget.removeEventListener(event, listener);
    }
}