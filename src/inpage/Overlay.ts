import { OverlayManager } from './overlayManager';

export class Overlay {

    private _manager: OverlayManager = null;
    private _callbacks: {
        [topic: string]: Function[]
    } = {};

    public frame: HTMLIFrameElement = null;

    private _queue: {
        topic: string,
        args: any[]
    }[] = [];

    private _isQueueProcessing: boolean = false;
    private _isFrameLoaded: boolean = false;

    constructor(manager: OverlayManager, uri: string, public title: string) {
        this._manager = manager;
        this.frame = document.createElement('iframe');
        this.frame.src = uri;
        this.frame.allowFullscreen = true;
        this.frame.addEventListener('load', () => {
            this._isFrameLoaded = true;
        });

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
    public open(callback?: Function) {
        this._manager.register(this);
        this._manager.activate(this);
        this._manager.open();

        if (!callback || typeof callback !== 'function') return;

        if (this._isFrameLoaded) {
            callback.apply({});
        } else {
            const loadHandler = () => {
                callback.apply({});
                this.frame.removeEventListener('load', loadHandler);
            }
            this.frame.addEventListener('load', loadHandler);
        }
    }

    /**
     * Removes tab from the panel.
     */
    public close() {
        this._manager.unregister(this);
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