import { WebSocketProxyClient } from "../utils/chrome-extension-websocket-wrapper";

export class Connection {
    private _ws: WebSocketProxyClient = null;

    private _callbacks: {
        [id: string]: Function[]
    } = {};

    constructor(url: string) {
        this._ws = new WebSocketProxyClient(url);
        this._ws.onopen = () => {
            console.log('WebSocket connection OPEN');
        };
        this._ws.onclose = () => {
            console.log('WebSocket connection CLOSED');
        };
        this._ws.onmessage = (msg) => {
            const message: { [id: string]: any } = JSON.parse(msg);

            message && Object.keys(message).forEach((id) => {
                let callbacks = this._callbacks[id];

                if (callbacks) {
                    for (let callback of callbacks) {
                        callback.call({}, message[id]);
                    }
                }
            });
        };
    }

    public subscribe(id: string, handler: (message: any) => void) {
        if (!this._callbacks[id]) {
            this._callbacks[id] = [];
        }

        this._callbacks[id].push(handler);

        this._ws.send(id);
    }
}