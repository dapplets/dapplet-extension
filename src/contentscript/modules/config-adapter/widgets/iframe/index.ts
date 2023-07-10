import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { generateGuid } from '../../../../../common/helpers'

export interface IIframeProps {
  ctx: any
  theme?: 'DARK' | 'LIGHT'
  insPointName?: string

  src: string
  init: (ctx: any, me: this) => void
}

export class Iframe extends LitElement implements IIframeProps {
  // public static override styles = styles
  public static widgetParamsDescription = {}

  // dapplet-widget/ prefix is needed as descriminator for contentscript that
  // should not be injected into the iframe
  private iframeName = `dapplet-widget/${generateGuid()}`

  @property() state
  @property() ctx
  @property() theme
  @property() insPointName
  @property() src
  @property() init: (ctx: any, me: this) => void

  connectedCallback() {
    super.connectedCallback()
    this.init?.(this.ctx, this.state)
    window.addEventListener('message', this._messageHandler)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('message', this._messageHandler)
  }

  _messageHandler = (e) => {
    if (
      e.data.name === this.iframeName &&
      e.data.frameHeight !== undefined &&
      e.data.frameWidth !== undefined
    ) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.shadowRoot.firstElementChild.style.height = `${e.data.frameHeight}px`

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.shadowRoot.firstElementChild.style.width = `${e.data.frameWidth}px`
    }
  }

  override render() {
    return html`<iframe
      name="${this.iframeName}"
      src="${this.src}"
      scrolling="no"
      frameborder="0"
      style="border:none;height:0px;width:0px;"
    ></iframe>`
  }
}
