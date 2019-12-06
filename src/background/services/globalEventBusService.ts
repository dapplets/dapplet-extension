const TOPIC_PREFIX = "dpl_";

export class GlobalEventBusService {
    private _ws: WebSocket

    constructor() {
        this._ws = new WebSocket('wss://bridge.walletconnect.org/')

        this._ws.onopen = function () {
            console.log("Connected to GlobalEventBus")
        }

        this._ws.onclose = function (event) {
            if (event.wasClean) {
                console.log('Connection is closed')
            } else {
                console.log('Connection is lost')
            }
            console.log('Code: ' + event.code + ' reason: ' + event.reason)
        }

        this._ws.onerror = function (error) {
            console.log("Error", error)
        }
    }

    public publish(topic: string, data: any) {
        this._ws.send(JSON.stringify({
            topic: TOPIC_PREFIX + topic,
            type: "pub",
            payload: data,
            silent: true
        }))
    }

    public subscribe(topic: string, func: Function) {
        // ToDo: check topic, parse data, fetch payload
        this._ws.addEventListener('message', (event) => func(topic, event.data))
        this._ws.send(JSON.stringify({
            topic: TOPIC_PREFIX + topic,
            type: "sub",
            payload: "",
            silent: true
        }))
    }
}