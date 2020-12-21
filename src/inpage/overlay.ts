import { OverlayManager } from './overlayManager';
import { IPubSub } from './types';

export enum SubscribeOptions {
    SINGLE_THREAD,
    MULTI_THREAD
}


export class Overlay implements IPubSub {
    private _manager: OverlayManager = null;
    private _queue: any[] = [];
    private _isFrameLoaded: boolean = false;
    private _msgCount: number = 0;
    public frame: HTMLIFrameElement = null;
    public registered: boolean = false;
    public onmessage: (topic: string, message: any) => void = null;
    public onclose: Function = null;

    constructor(manager: OverlayManager, public uri: string, public title: string, public hidden: boolean = false) {

        // disable cache
        const url = new URL(uri);
        if (url.protocol !== 'blob:') {
            url.searchParams.set('_dc', Date.now().toString());
        }

        this._manager = manager;
        this.frame = document.createElement('iframe');
        this.frame.allow = 'clipboard-write';
        this.frame.src = url.href;
        this.frame.allowFullscreen = true;
        this.frame.addEventListener('load', () => {
            //setTimeout(() => {
            this._isFrameLoaded = true;
            this._queue.forEach(msg => this._send(msg));
            this._queue = [];
            //}, 1000);
        });
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
        this._isFrameLoaded = false;
        this._manager.unregister(this);
    }

    public send(topic: string, args: any[]) {
        const msg = JSON.stringify({ topic, args }); // ToDo: fix args
        // this.frame.contentWindow.postMessage(msg, '*');
        this._send(msg);
    }

    private _send(data: any) {
        if (!this._isFrameLoaded) {
            this._queue.push(data);
            this.open();
        } else {
            this.frame.contentWindow.postMessage(data, '*');
        }
    }

    public exec(topic: string, message: any) {
        return new Promise((resolve, reject) => {
            const id = (++this._msgCount).toString();
            const data = JSON.stringify({
                id,
                topic,
                message
            });
            this._send(data);

            const listener = (e: MessageEvent) => {
                if (e.source != this.frame.contentWindow) return; // Listen messages from only our frame
                if (!e.data) return;

                const data = JSON.parse(e.data);

                if (!data.topic && data.id === id) {
                    window.removeEventListener('message', listener);
                    if (!data.error) {
                        resolve(data.result);
                    } else {
                        reject(data.error);
                    }
                }
            }
            window.addEventListener('message', listener, false);
        });
    }

    public onMessage(handler: (topic: string, message: any) => void) {
        const listener = (e: MessageEvent) => {
            if (e.source !== this.frame.contentWindow) return; // Listen messages from only our frame
            if (!e.data) return;
            const data = JSON.parse(e.data);
            if (data.topic !== undefined) handler(data.topic, data.message);
        }

        window.addEventListener('message', listener);

        return {
            off: () => window.removeEventListener('message', listener)
        };
    }
}