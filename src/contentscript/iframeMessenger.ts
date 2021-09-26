import { generateGuid } from "../common/helpers";

export class IframeMessenger {

    private _callbacks = new Map<string, Set<Function>>();

    constructor() {
        window.addEventListener('message', this._handler);
    }

    public call(method: string, params: any[], frame: Window): Promise<any> {
        return new Promise((res, rej) => {
            const id = generateGuid();

            const rpcRequest = {
                "jsonrpc": "2.0",
                "id": id,
                "method": method,
                "params": params
            };

            const json = JSON.stringify(rpcRequest);

            const handler = async (event: MessageEvent<any>) => {
                try {
                    const rpcResponse = JSON.parse(event.data);
                    if (rpcResponse.id !== id) return;

                    window.removeEventListener('message', handler);

                    if (rpcResponse.error) {
                        rej(rpcResponse.error.message);
                        return;
                    }

                    res(rpcResponse.result);

                } catch (_) { }
            }

            window.addEventListener('message', handler);
            frame.postMessage(json, '*');
        });
    }

    public on(method: string, callback: (...args: any[]) => Promise<any> | undefined | boolean) {
        if (!this._callbacks.has(method)) this._callbacks.set(method, new Set());
        this._callbacks.get(method).add(callback);
    }

    public destroy() {
        this._callbacks.clear();
        window.removeEventListener('message', this._handler);
    }

    private _handler = async (event: MessageEvent<any>) => {
        let rpcRequest;

        try {
            rpcRequest = JSON.parse(event.data);
        } catch (_) {
            return;
        }

        if (!rpcRequest.method || !rpcRequest.params || !rpcRequest.id) return;

        const callbacks = this._callbacks.get(rpcRequest.method) ?? new Set();
        
        for (const callback of callbacks) {
            try {
                const promise = callback(...rpcRequest.params, event.source);
                if (promise === undefined || promise === false) continue;
                if (Promise.resolve(promise) !== promise && promise !== true) { // not a promise and not a true
                    console.error('A callback in IframeMessenger.on() must return a Promise or undefined.');
                    continue;
                }

                const result = promise === true ? undefined : await promise;

                const rpcResponse = JSON.stringify({
                    "jsonrpc": "2.0",
                    "result": result,
                    "id": rpcRequest.id
                });

                (event.source as any).postMessage(rpcResponse, event.origin);
                return;
            } catch (err) {
                const rpcResponse = JSON.stringify({
                    "jsonrpc": "2.0",
                    "error": {
                        "message": err.message
                    },
                    "id": rpcRequest.id
                });

                (event.source as any).postMessage(rpcResponse, event.origin);
                return;
            }
        }

        const rpcResponse = JSON.stringify({
            "jsonrpc": "2.0",
            "error": {
                "code": -32601,
                "message": "Method not found"
            },
            "id": rpcRequest.id
        });

        (event.source as any).postMessage(rpcResponse, event.origin);
    }
}