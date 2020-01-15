import { OverlayManager } from './overlayManager';

export enum SubscribeOptions {
    SINGLE_THREAD,
    MULTI_THREAD
}


export class Overlay {

    private _manager: OverlayManager = null;

    public frame: HTMLIFrameElement = null;

    private _queue: {
        topic: string,
        message: any
    }[] = [];

    private _isQueueProcessing: boolean = false;
    private _isFrameLoaded: boolean = false;

    public registered: boolean = false;

    public onmessage: (topic: string, message: any) => void = null;

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

            const { topic, message, args } = JSON.parse(e.data);
            if (!topic) return;

            this._queue.push({
                topic: topic,
                message: message || args
            });
            this.processQueue();
        }, false);
    }

    async processQueue() {
        if (this._isQueueProcessing) return;
        if (!this.onmessage) return;

        this._isQueueProcessing = true;

        while (this._queue.length > 0) {
            const { topic, message } = this._queue.shift();
            this.onmessage.bind({}, [topic, message]);
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

    public send(topic: string, message: any) {
        const msg = JSON.stringify({ topic, message: [message] }); // ToDo: fix args
        this.frame.contentWindow.postMessage(msg, '*');
    }
}