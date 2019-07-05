import { OverlayManager } from './overlayManager';

export class Overlay {
    private _callbacks: Function[] = [];
    public frame: HTMLIFrameElement = null;

    constructor(private manager: OverlayManager, uri: string, public title: string) {
        this.frame = document.createElement('iframe');
        this.frame.src = uri;
        this.frame.allowFullscreen = true;

        window.addEventListener('message', (e) => {
            if (e.source != this.frame.contentWindow) return; // Listen messages from only our frame

            let callbacks = this._callbacks;

            if (callbacks) {
                for (let callback of callbacks) {
                    callback.call({}, e.data);
                }
            }

        }, false);
    }
    
    // показать пользователю
    public open() {
        this.manager.register(this);
        this.manager.activate(this);
        this.manager.open();
    }
    
    public close() {
        this.manager.unregister(this);
    }
    
    public publish(msg: string) {
        this.frame.contentWindow.postMessage(msg, '*');
    }    

    public subscribe(handler: (message: any) => void) {
        this._callbacks.push(handler);
    }
}