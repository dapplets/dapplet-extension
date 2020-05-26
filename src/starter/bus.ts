export class Bus {
    _callbacks: { [topic: string]: Function[] } = {};

    constructor() {
        window.addEventListener('message', async (e) => {
            try {
                const data = JSON.parse(e.data);
                if (!data || !data.topic) return;

                const callbacks = this._callbacks[data.topic] || [];

                for (const callback of callbacks) {
                    const result = callback.apply({}, [data.message]);
                    if (data.id) {
                        const msg = JSON.stringify({
                            id: data.id,
                            result: result
                        });
                        window.parent.postMessage(msg, '*');
                    }
                }
            } catch (ex) { }
        });
    }

    publish(topic: string, message: any) {
        const msg = JSON.stringify({ topic, message });
        window.parent.postMessage(msg, '*');
    }

    subscribe(topic: string, handler: Function) {
        if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(handler);
    }

    unsubscribe(topic: string) {
        this._callbacks[topic] = [];
    }
}
