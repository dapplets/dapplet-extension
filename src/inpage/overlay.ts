import { OverlayManager } from './overlayManager';
import { IPubSub } from './types';

export enum SubscribeOptions {
    SINGLE_THREAD,
    MULTI_THREAD
}


export class Overlay implements IPubSub {
    private _queue: any[] = [];
    private _isFrameLoaded: boolean = false;
    private _msgCount: number = 0;
    public frame: HTMLIFrameElement = null;
    public registered: boolean = false;
    public onmessage: (topic: string, message: any) => void = null;
    public onclose: Function = null;
    public loader: HTMLDivElement;

    constructor(private _manager: OverlayManager, public uri: string, public title: string, public hidden: boolean = false) {

        // // disable cache
        // const url = new URL(uri);
        // if (url.protocol !== 'blob:') {
        //     url.searchParams.set('_dc', Date.now().toString());
        // }

        this._addLoader();
        this.frame = document.createElement('iframe');
        this.frame.allow = 'clipboard-write';
        // this.frame.sandbox.add('allow-scripts'); // to use js frameworks in overlays
        // this.frame.sandbox.add('allow-forms'); // ToDo: rjsf uses forms in settings overlay. disallow it
        // this.frame.sandbox.add('allow-popups'); // ToDo: links depend on it. disallow it.
        this.frame.src = uri;
        this.frame.allowFullscreen = true;
        this.frame.addEventListener('load', () => {
            //setTimeout(() => {
            this.loader?.remove();
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

    private _addLoader() {
      const loaderDiv = document.createElement('div');
      loaderDiv.classList.add('loader-container');
      loaderDiv.innerHTML = `
          <style>
              .loader-container {
                  z-index: -1;
                  position: absolute;
                  top: calc(50vh - 88px);
              }

              .loader-container .flex {
                  min-height: 60pt
              }

              .loader-container .loader {
                  width: 50pt;
                  height: 50pt;
                  margin-left: auto;
                  margin-right: auto;
                  border: 5px solid #f1f1f1;
                  border-top: 5px solid #000;
                  border-radius: 50%;
                  animation: spin 2s linear infinite
              }

              @keyframes spin {
                  0% {
                      transform: rotate(0)
                  }
                  100% {
                      transform: rotate(360deg)
                  }
              }

              .loader-container .load-text {
                  padding-top: 15px;
                  text-align: center;
                  font: 14pt "Helvetica Neue", Helvetica, Arial, sans-serif;
                  color: #000
              }
          </style>
          <div class="flex">
              <div class="loader"></div>
          </div>
          <div class="load-text">Loading Overlay...</div>
          <div class="load-text">Downloading from decentralized sources like Swarm or IPFS can take some time</div>
      `;
      this.loader = loaderDiv;
    }
}