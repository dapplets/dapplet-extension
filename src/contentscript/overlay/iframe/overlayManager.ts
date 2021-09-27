import { JsonRpc } from "../../../common/jsonrpc";
import { IOverlayManager } from "../interfaces";
import { OverlayIframe } from "./overlay";

export class OverlayManagerIframe implements IOverlayManager {
    constructor(private _iframeMessenger: JsonRpc) { }

    createOverlay(url: string, title: string, hidden?: boolean): OverlayIframe {
        const overlay = new OverlayIframe(url, title, hidden, this._iframeMessenger);
        return overlay;
    }

    openPopup(path: string): void { }
    unregisterAll(): void { }
    close(): void { }
    getOverlays(): OverlayIframe[] { return []; }
    toggle(): void { }
    destroy(): void { }
}