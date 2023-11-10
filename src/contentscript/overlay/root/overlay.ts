import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
import { generateGuid } from '../../../common/generateGuid'
import { UrlAvailability } from '../../../common/types'
import { IOverlay, OverlayConfig, OverlaySourceModule } from '../interfaces'
import { OverlayManager } from './overlayManager'

export class Overlay implements IOverlay {
  public url: string
  public title: string
  public source: string = null
  public hidden = false
  public parent: IOverlay = null
  public module: OverlaySourceModule = null
  public isSystemPopup: boolean
  public registryUrl: string = null

  public _queue: any[] = []
  public _isFrameLoaded = false
  private _msgCount = 0

  public readonly id = generateGuid()
  public frame: HTMLIFrameElement = null
  public registered = false
  public onmessage: (topic: string, message: any) => void = null
  public onclose: Function = null
  public onregisteredchange: (value: boolean) => void = null
  public isError = false

  constructor(private _manager: OverlayManager, config: OverlayConfig) {
    this.url = config.url
    this.title = config.title
    this.source = config.source ?? null
    this.hidden = config.hidden ?? false
    this.parent = config.parent ?? null
    this.module = config.module ?? null
    this.isSystemPopup = config.isSystemPopup ?? false
    this.registryUrl = config.registryUrl ?? null

    // // disable cache
    // const url = new URL(uri);
    // if (url.protocol !== 'blob:') {
    //     url.searchParams.set('_dc', Date.now().toString());
    // }

    this.frame = document.createElement('iframe')
    this.frame.allow = 'clipboard-write'
    // this.frame.sandbox.add('allow-scripts'); // to use js frameworks in overlays
    // this.frame.sandbox.add('allow-forms'); // ToDo: rjsf uses forms in settings overlay. disallow it
    // this.frame.sandbox.add('allow-popups'); // ToDo: links depend on it. disallow it.
    this.frame.src = this.url
    this.frame.allowFullscreen = true
    this.frame.addEventListener('load', () => {
      // this.loader?.remove();
      if (!this.isError) {
        this._isFrameLoaded = true
        this._queue.forEach((msg) => this._send(msg))
        this._queue = []
      }
    })
    this.frame.name = 'dapplet-overlay/' + this.id // to distinguish foreign frames from overlays (see contentscript/index.ts)
    this.frame.setAttribute('id', 'overlay-iframe')
  }

  /**
   * Opens tab. If it doesn't exist, then adds tab to the panel.
   */
  public open(callback?: Function) {
    this._manager.register(this)

    if (!this.isSystemPopup) {
      this._manager.activate(this)
    }

    this._manager.open()

    if (this._isFrameLoaded) {
      callback?.apply({})
    } else {
      const loadHandler = () => {
        if (!this.isError) {
          callback?.apply({})
        }
        this.frame.removeEventListener('load', loadHandler)
      }

      this.frame.addEventListener('load', loadHandler)
    }
  }

  /**
   * Removes tab from the panel.
   */
  public close() {
    this._isFrameLoaded = false
    this._manager.unregister(this)
    this.frame.dispatchEvent(new CustomEvent('onOverlayClose'))
  }

  public send(topic: string, args: any[]) {
    const msg = JSON.stringify({ topic, args }) // ToDo: fix args
    this._send(msg)
  }

  private _send(data: any) {
    if (!this._isFrameLoaded || !this.frame.contentWindow) {
      this._queue.push(data)
      this.open()
    } else {
      // ToDo: send message to the specific origin
      this.frame.contentWindow.postMessage(data, '*')
    }
  }

  public exec(topic: string, message: any) {
    return new Promise((resolve, reject) => {
      const id = (++this._msgCount).toString()
      const data = JSON.stringify({
        id,
        topic,
        message,
      })
      this._send(data)

      const listener = (e: MessageEvent) => {
        let data = null

        try {
          if (!e.data) return
          const json =
            typeof e.data === 'string'
              ? e.data
              : typeof e.data === 'object' && typeof e.data.message === 'string'
              ? e.data.message
              : null
          if (!json) return
          data = JSON.parse(json)
        } catch (_) {}

        if (!data) return
        if (!(e.source === this.frame.contentWindow || data.windowName === this.frame.name)) return // Listen messages from only our frame

        if (!data.topic && data.id === id) {
          window.removeEventListener('message', listener)
          if (!data.error) {
            resolve(data.result)
          } else {
            reject(data.error)
          }
        }
      }
      window.addEventListener('message', listener, false)
    })
  }

  public onMessage(handler: (topic: string, message: any) => void) {
    const listener = (e: MessageEvent) => {
      let data = null

      try {
        if (!e.data) return
        const json =
          typeof e.data === 'string'
            ? e.data
            : typeof e.data === 'object' && typeof e.data.message === 'string'
            ? e.data.message
            : null
        if (!json) return
        data = JSON.parse(json)
      } catch (_) {}

      if (!data) return

      // ToDo: the expression below is always false in jslib + wombat
      if (!(e.source === this.frame.contentWindow || data.windowName === this.frame.name)) return // Listen messages from only our frame

      if (data.topic !== undefined) handler(data.topic, data.message)
    }

    window.addEventListener('message', listener)

    return {
      off: () => window.removeEventListener('message', listener),
    }
  }

  public async checkAvailability() {
    const { checkUrlAvailability } = await initBGFunctions(browser)
    const availability: UrlAvailability = await checkUrlAvailability(this.url)

    if (availability === UrlAvailability.AVAILABLE) {
      this.isError = false
    } else if (availability === UrlAvailability.NETWORK_ERROR) {
      this.isError = true
      this.frame.dispatchEvent(new Event('error_network'))
    } else if (availability === UrlAvailability.SERVER_ERROR) {
      this.isError = true
      this.frame.dispatchEvent(new Event('error_server'))
    }
  }
}
