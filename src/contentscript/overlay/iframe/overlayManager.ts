import { JsonRpc } from '../../../common/jsonrpc'
import { IOverlayManager, OverlayConfig } from '../interfaces'
import { OverlayIframe } from './overlay'

export class OverlayManagerIframe implements IOverlayManager {
  constructor(private _iframeMessenger: JsonRpc) {}

  createOverlay(config: OverlayConfig): OverlayIframe {
    const overlay = new OverlayIframe(this._iframeMessenger, config)
    return overlay
  }
  show(): void {}
  togglePanel(): void {}
  openPopup(): void {}
  unregisterAll(source: string): void {
    this._iframeMessenger.call('OVERLAY_MANAGER_UNREGISTER_ALL', [source], window.top)
  }
  close(): void {}
  open(): void {}
  getOverlays(): OverlayIframe[] {
    return []
  }
  toggle(): void {}
  destroy(): void {}
}
