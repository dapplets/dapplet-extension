export class Connection {
    private _ws: WebSocket = null;

    private _callbacks: {
        [id: string]: Function[]
    } = {};

    private _listenableIds : string[] = [];

    constructor(url: string) {
        this._ws = new WebSocket(url);
        this._ws.onopen = () => {
            console.log('WebSocket connection OPENED');
            this._listenableIds.forEach(id => this._sendNewId(id));
            this._listenableIds = [];
        };
        this._ws.onclose = () => {
            console.log('WebSocket connection CLOSED');
        };
        this._ws.onmessage = (e) => {
            
            const message: { [id: string]: any } = JSON.parse(e.data);

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

        if (this._ws.readyState != this._ws.OPEN) {
            this._listenableIds.push(id);
        } else {
            this._sendNewId(id);
        }

        return {
            close: () => {
                delete this._callbacks[id];
                // ToDo: publish unsubscribe to server
            }
        };
    }

    private _sendNewId(id: string) {
        this._ws.send(id);
    }
}