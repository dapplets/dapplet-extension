import { JsonRpc } from "../../../common/jsonrpc";
import { IOverlayManager } from "../interfaces";
import { OverlayIframe } from "./overlay";

export class OverlayManagerIframe implements IOverlayManager {
    constructor(private _iframeMessenger: JsonRpc) { }

    createOverlay(url: string, title: string, source: string, hidden?: boolean): OverlayIframe {
        const overlay = new OverlayIframe(url, title, source, hidden, this._iframeMessenger);
        return overlay;
    }

    openPopup(path: string): void { }
    unregisterAll(source: string): void { 
        this._iframeMessenger.call('OVERLAY_MANAGER_UNREGISTER_ALL', [source], window.top);
    }
    close(): void { }
    getOverlays(): OverlayIframe[] { return []; }
    toggle(): void { }
    destroy(): void { }
}