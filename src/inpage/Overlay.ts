import { OverlayManager } from './overlayManager';

export class Overlay {
    private _callbacks: {
        [topic: string]: Function[]
    } = {};

    public frame: HTMLIFrameElement = null;

    private _queue: {
        topic: string,
        args: any[]
    }[] = [];

    private _isQueueProcessing: boolean = false;

    constructor(private manager: OverlayManager, uri: string, public title: string) {
        this.frame = document.createElement('iframe');
        this.frame.src = uri;
        this.frame.allowFullscreen = true;

        window.addEventListener('message', (e) => {
            if (e.source != this.frame.contentWindow) return; // Listen messages from only our frame
            if (!e.data) return;

            const { topic, args } = JSON.parse(e.data);
            if (!topic || !args) return;

            this._queue.push({ topic, args });
            this.processQueue();
        }, false);
    }

    async processQueue() {
        if (this._isQueueProcessing) return;

        this._isQueueProcessing = true;

        while (this._queue.length > 0) {
            const { topic, args } = this._queue.shift();
            const callbacks = this._callbacks[topic] || [];

            for (const callback of callbacks) {
                await callback.bind({}, ...args)(); // ToDo: Think about execution order. Sync is now.
            }
        }

        this._isQueueProcessing = false;
    }

    /**
     * Opens tab. If it doesn't exist, then adds tab to the panel.
     */
    public open() {
        this.manager.register(this);
        this.manager.activate(this);
        this.manager.open();
    }

    /**
     * Removes tab from the panel.
     */
    public close() {
        this.manager.unregister(this);
    }

    public publish(topic: string, ...args: any) {
        const msg = JSON.stringify({ topic, args });
        this.frame.contentWindow.postMessage(msg, '*');
    }

    public subscribe(topic: string, handler: Function) {
        if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(handler);
    }

    public unsubscribe(topic: string) {
        this._callbacks[topic] = [];
    }
}