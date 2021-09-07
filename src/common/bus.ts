export class Bus {
    _callbacks = {};

    _queue: {
        [topic: string]: any[]
    } = {};

    constructor() {
        window.addEventListener('message', async (e) => {
            let data = null;

            try {
                console.log('bus.onmessage', { event: e });
                data = JSON.parse(e.data);
            } catch {
                return;
            }

            if (!data || !data.topic) return;

            let callbacks = this._callbacks[data.topic] || [];

            if (callbacks.length === 0) {
                console.log('bus.onmessage', 'queued');
                if (this._queue[data.topic]) {
                    this._queue[data.topic].push(data.args)
                } else {
                    this._queue[data.topic] = [data.args];
                }
            } else {
                for (const callback of callbacks) {
                    console.log('bus.onmessage', 'call callback');
                    callback.apply({}, data.args);
                }
            }
        });
    }

    publish(topic, ...args) {
        const msg = JSON.stringify({ topic, args });
        window.parent.postMessage(msg, '*');
    }

    subscribe(topic, handler) {
        console.log('bus.subscribe', topic);
        if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(handler);

        while (this._queue[topic]?.length > 0) {
            const args = this._queue[topic].shift();
            handler.apply({}, args);
        }
    }

    unsubscribe(topic) {
        this._callbacks[topic] = [];
    }
}