import { generateGuid } from '../../../common/helpers';
import { IOverlay } from '../interfaces';
import { OverlayManager } from './overlayManager';

export class Overlay implements IOverlay {
    public _queue: any[] = [];
    public _isFrameLoaded: boolean = false;
    private _msgCount: number = 0;

    public readonly id = generateGuid();
    public frame: HTMLIFrameElement = null;
    public registered: boolean = false;
    public onmessage: (topic: string, message: any) => void = null;
    public onclose: Function = null;
    public onregisteredchange: (value: boolean) => void = null;

    constructor(
        private _manager: OverlayManager,
        public uri: string,
        public title: string,
        public source: string = null,
        public hidden: boolean = false,
        public parent: Overlay = null
    ) {

        // // disable cache
        // const url = new URL(uri);
        // if (url.protocol !== 'blob:') {
        //     url.searchParams.set('_dc', Date.now().toString());
        // }

        this.frame = document.createElement('iframe');
        this.frame.allow = 'clipboard-write';
        // this.frame.sandbox.add('allow-scripts'); // to use js frameworks in overlays
        // this.frame.sandbox.add('allow-forms'); // ToDo: rjsf uses forms in settings overlay. disallow it
        // this.frame.sandbox.add('allow-popups'); // ToDo: links depend on it. disallow it.
        this.frame.src = uri;
        this.frame.allowFullscreen = true;
        this.frame.addEventListener('load', () => {
            // this.loader?.remove();
            this._isFrameLoaded = true;
            this._queue.forEach(msg => this._send(msg));
            this._queue = [];
        });
        this.frame.name = 'dapplet-overlay/' + this.id; // to distinguish foreign frames from overlays (see contentscript/index.ts)
    }

    /**
     * Opens tab. If it doesn't exist, then adds tab to the panel.
     */
    public open(callback?: Function) {
        this._manager.register(this);
        this._manager.activate(this);
        this._manager.open();

        if (this._isFrameLoaded) {
            callback?.apply({});
        } else {
            const loadHandler = () => {
                callback?.apply({});
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
        this.frame.dispatchEvent(new CustomEvent('onOverlayClose'));
    }

    public send(topic: string, args: any[]) {
        const msg = JSON.stringify({ topic, args }); // ToDo: fix args
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
                let data = null;

                try {
                    if (!e.data) return;
                    const json = (typeof e.data === 'string') ? e.data : (typeof e.data === 'object' && typeof e.data.message === 'string') ? e.data.message : null;
                    if (!json) return;
                    data = JSON.parse(json);
                } catch (_) { }

                if (!data) return;
                if (!(e.source === this.frame.contentWindow || data.windowName === this.frame.name)) return; // Listen messages from only our frame

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
            let data = null;

            try {
                if (!e.data) return;
                const json = (typeof e.data === 'string') ? e.data : (typeof e.data === 'object' && typeof e.data.message === 'string') ? e.data.message : null;
                if (!json) return;
                data = JSON.parse(json);
            } catch (_) { }

            if (!data) return;

            // ToDo: the expression below is always false in jslib + wombat
            if (!(e.source === this.frame.contentWindow || data.windowName === this.frame.name)) return; // Listen messages from only our frame

            if (data.topic !== undefined) handler(data.topic, data.message);
        }

        window.addEventListener('message', listener);

        return {
            off: () => window.removeEventListener('message', listener)
        };
    }
}