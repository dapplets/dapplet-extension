import { generateGuid } from "../../../common/helpers";
import { JsonRpc } from "../../../common/jsonrpc";
import { IOverlay } from "../interfaces";

export class OverlayIframe implements IOverlay {
    frame: HTMLIFrameElement;
    registered: boolean = false;
    onmessage: (topic: string, message: any) => void;
    onclose: Function;
    loader: HTMLDivElement;
    onregisteredchange: (value: boolean) => void;
    source: string = null;

    private _id: string;
    private _callbacks = new Set<Function>();

    constructor(public uri: string, public title: string, public hidden: boolean = false, private _iframeMessenger: JsonRpc) {
        this._id = generateGuid();
        this._iframeMessenger.call('OVERLAY_CREATE', [this._id, uri, title, hidden], window.top);
        this._iframeMessenger.on('OVERLAY_EXEC', (id: string, topic: string, message: string) => {
            if (id !== this._id) return;
            this._callbacks.forEach(x => x(topic, message));
            return true;
        });
        this._iframeMessenger.on('OVERLAY_REGISTERED_CHANGE', (id: string, value: boolean) => {
            if (id !== this._id) return;
            this.registered = value;
            return true;
        });
    }

    open(callback?: Function): void {
        this._iframeMessenger.call('OVERLAY_OPEN', [this._id], window.top).then(() => callback?.());
    }

    close(): void {
        this._iframeMessenger.call('OVERLAY_CLOSE', [this._id], window.top);
    }

    send(topic: string, args: any[]): void {
        this._iframeMessenger.call('OVERLAY_SEND', [this._id, topic, args], window.top);
    }

    exec(topic: string, message: any): Promise<void> {
        return this._iframeMessenger.call('OVERLAY_EXEC', [this._id, topic, message], window.top);
    }

    onMessage(handler: (topic: string, message: any) => void): { off: () => void; } {
        this._callbacks.add(handler);
        return {
            off: () => this._callbacks.delete(handler)
        }
    }
}