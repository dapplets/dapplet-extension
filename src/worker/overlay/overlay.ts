import { generateGuid } from '../../common/generateGuid'
import { JsonRpc } from '../../common/jsonrpc'
import { IOverlay, OverlayConfig } from './interfaces'

export class OverlayIframe implements IOverlay {
  public url: string
  public title: string
  public source: string = null
  public hidden = false
  public parent: IOverlay

  frame: HTMLIFrameElement
  registered = false
  onmessage: (topic: string, message: any) => void
  onclose: Function
  loader: HTMLDivElement
  onregisteredchange: (value: boolean) => void

  public readonly id = generateGuid()
  private _callbacks = new Set<Function>()

  constructor(private _iframeMessenger: JsonRpc, config: OverlayConfig) {
    this.url = config.url
    this.title = config.title
    this.source = config.source ?? null
    this.hidden = config.hidden ?? false
    this.parent = config.parent ?? null

    this._iframeMessenger.call(
      'OVERLAY_CREATE',
      [this.id, this.url, this.title, this.source, this.hidden],
      self
    )
    this._iframeMessenger.on('OVERLAY_EXEC', (id: string, topic: string, message: string) => {
      if (id !== this.id) return
      this._callbacks.forEach((x) => x(topic, message))
      return true
    })
    this._iframeMessenger.on('OVERLAY_REGISTERED_CHANGE', (id: string, value: boolean) => {
      if (id !== this.id) return
      this.registered = value
      return true
    })
    this._iframeMessenger.on('OVERLAY_CLOSED', (id: string) => {
      if (id !== this.id) return
      this.onclose?.()
      return true
    })
  }

  open(callback?: Function): void {
    this._iframeMessenger.call('OVERLAY_OPEN', [this.id], self).then(() => callback?.())
  }

  close(): void {
    this._iframeMessenger.call('OVERLAY_CLOSE', [this.id], self)
    // callback onClose will be called in OVERLAY_CLOSED handler asynchroniously
  }

  send(topic: string, args: any[]): void {
    this._iframeMessenger.call('OVERLAY_SEND', [this.id, topic, args], self)
  }

  exec(topic: string, message: any): Promise<void> {
    return this._iframeMessenger.call('OVERLAY_EXEC', [this.id, topic, message], self)
  }

  onMessage(handler: (topic: string, message: any) => void): { off: () => void } {
    this._callbacks.add(handler)
    return {
      off: () => this._callbacks.delete(handler),
    }
  }
}
