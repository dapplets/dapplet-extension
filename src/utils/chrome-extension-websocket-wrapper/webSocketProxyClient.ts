import { MESSAGE_BUS_NAME } from './constants'

export default class WebSocketProxyClient {
    private _port: chrome.runtime.Port = null;
    private _isMsgBusConnected: boolean = false;
    constructor(url: string) {
        this._port = chrome.runtime.connect({ name: MESSAGE_BUS_NAME });
        this.url = url;
        this._isMsgBusConnected = true;

        this._port.postMessage({ event: 'connect', data: url });

        this._port.onMessage.addListener((message: { data: string, event: string }) => {
            if (message.event == 'message') {
                this.onmessage && this.onmessage(message.data);
            }
            else if (message.event == 'open') {
                this.onopen && this.onopen();
            }
            else if (message.event == 'error') {
                this.onerror && this.onerror();
            }
        });

        this._port.onDisconnect.addListener(() => {
            this._isMsgBusConnected = false;
            this.onclose && this.onclose();
        });
    }

    public readonly url: string;

    public onclose: () => void = null;
    public onmessage: (data: string) => void = null;
    public onopen: () => void = null;
    public onerror: () => void = null;

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
}