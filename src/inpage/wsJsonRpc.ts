export class WsJsonRpc {
    private _queue: any[] = [];
    private _ws: WebSocket;

    private _msgCount: number = 0;

    constructor(public readonly url: string) {
        this._connect();
    }

    public exec(method: string, params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this._msgCount;
            this._send(JSON.stringify({
                jsonrpc: "2.0", id, method, params
            }));
            const listener = (ev: MessageEvent) => {
                const rpc = JSON.parse(ev.data);

                if (!rpc.method && rpc.id === id) {
                    this._ws.removeEventListener('message', listener);
                    if (!rpc.error) {
                        resolve(rpc.result);
                    } else {
                        reject(rpc.error);
                    }
                }
            }
            this._ws.addEventListener('message', listener);
        });
    }

    // ToDo: do we need this method?
    public notify(method: string, params: any[]): void {
        this._send(JSON.stringify({
            jsonrpc: "2.0", method, params
        }));
    }

    public on(method: string, handler: (params: any | any[]) => any): { off: () => void } {
        const listener = (ev: MessageEvent) => {
            const rpc = JSON.parse(ev.data);

            if (rpc.method === method) {
                try {
                    const result = handler(rpc.params);
                    if (rpc.id) {
                        this._send(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpc.id,
                            result: result
                        }));
                    }
                } catch (err) {
                    if (rpc.id) {
                        this._send(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpc.id,
                            error: {
                                // ToDo: add error code
                                message: err.message
                            }
                        }));
                    }
                }
            }
        }

        this._ws.addEventListener('message', listener);

        return {
            off: () => this._ws.removeEventListener('message', listener)
        };
    }

    private _connect() {
        this._ws = new WebSocket(this.url);
        this._ws.onopen = () => {
            this._queue.forEach(msg => this._ws.send(msg));
            this._queue = [];
        };
        this._ws.onclose = () => {
            this._msgCount = 0;
        };
    }

    private _send(data: any) {
        if (this._ws.readyState !== WebSocket.OPEN) {
            this._queue.push(data);
            if (this._ws.readyState === WebSocket.CLOSED) {
                this._connect();
            }
        } else {
            this._ws.send(data);
        }
    }
}