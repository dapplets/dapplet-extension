import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'

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

  @property() state
  @property() ctx
  @property() theme
  @property() insPointName
  @property() src
  @property() init: (ctx: any, me: this) => void

  connectedCallback() {
    super.connectedCallback()
    this.init?.(this.ctx, this.state)
  }

  override render() {
    return html`<iframe src="${this.src}"></iframe>`
  }
}
