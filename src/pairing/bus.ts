export class Bus {
    _callbacks = {};

    constructor() {
        window.addEventListener('message', async (e) => {
            try {
                const data = JSON.parse(e.data);
                if (!data || !data.topic) return;
                
                let callbacks = this._callbacks[data.topic] || [];

                for (const callback of callbacks) {
                    callback.apply({}, ...data.args);
                }
            } catch (ex) { }
        });
    }

    publish(topic, ...args) {
        const msg = JSON.stringify({ topic, args });
        window.parent.postMessage(msg, '*');
    }

    subscribe(topic, handler) {
        if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(handler);
    }

    unsubscribe(topic) {
        this._callbacks[topic] = [];
    }
}