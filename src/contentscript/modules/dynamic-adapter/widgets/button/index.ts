import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { description } from './description'
import LOADER from './loader.svg'
import { styles } from './wb-button.css'

export interface IButtonProps {
  ctx: any
  theme?: 'DARK' | 'LIGHT'
  insPointName?: string

  img: string
  basic?: boolean
  label: string
  tooltip?: string
  loading: boolean
  disabled: boolean
  hidden?: boolean
  exec: (ctx: any, me: this) => void
  init: (ctx: any, me: this) => void
}

export class Button extends LitElement implements IButtonProps {
  public static override styles = styles
  public static widgetParamsDescription = description
  public static contextInsPoints = {
    POST: 'SOUTH',
    QUOTE_POST: 'SOUTH',
    PROFILE: 'BUTTON_GROUP',
  }

  @property() state
  @property() ctx
  @property() theme
  @property() insPointName
  @property() img
  @property() basic
  @property() label
  @property() tooltip
  @property() loading = false
  @property() disabled = false
  @property() hidden = false
  @property() exec: (ctx: any, me: this) => void
  @property() init: (ctx: any, me: this) => void

  connectedCallback() {
    super.connectedCallback()
    this.init?.(this.ctx, this.state)
  }

  private _clickHandler(e) {
    e.stopPropagation()
    !this.disabled && this.exec?.(this.ctx, this.state)
  }

  override render() {
    if (this.hidden) return null
    if (this.insPointName === 'POST' || this.insPointName === 'QUOTE_POST') {
      return html`
        <div
          class="css-1dbjc4n r-18u37iz r-1h0z5md"
          @click=${this._clickHandler}
          title=${this.tooltip}
          style=${styleMap({
            marginTop: this.insPointName === 'QUOTE_POST' ? '12px' : undefined,
          })}
        >
          <div
            role="button"
            tabindex="0"
            class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr dapplet-widget-post-button"
            data-testid="reply"
            style=${styleMap({ opacity: this.disabled ? '.5' : '1' })}
          >
            <div
              dir="ltr"
              class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0"
            >
              <div class="css-1dbjc4n r-xoduu5">
                <div
                  class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"
                ></div>
                <img
                  height="18"
                  src="${this.loading ? LOADER : this.img || null}"
                  class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi"
                />
              </div>
              ${this.label?.toString() &&
              html`<div class="css-1dbjc4n r-xoduu5 r-1udh08x">
                <span
                  data-testid="app-text-transition-container"
                  style="transition-property: transform; transition-duration: 0.3s; transform: translate3d(0px, 0px, 0px);"
                >
                  <span
                    class="css-901oao css-16my406 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-1e081e0 r-qvutc0"
                  >
                    <span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">
                      ${this.label}
                    </span>
                  </span>
                </span>
              </div>`}
            </div>
          </div>
        </div>
      `
    } else if (this.insPointName === 'PROFILE') {
      return html`<button
        @click=${this._clickHandler}
        title=${this.tooltip}
        class=${classMap({
          'dapplet-widget-profile-button': true,
          'dapplet-widget-profile-button-light': this.theme === 'LIGHT',
          'dapplet-widget-profile-button-dark': this.theme === 'DARK',
          'dapplet-widget-profile-button-basic': this.basic,
        })}
        style=${styleMap({
          opacity: this.disabled ? '.5' : '',
          display: 'flex',
          alignItems: 'baseline',
        })}
        ?disabled=${this.disabled}
      >
        <img
          style=${styleMap({
            width: this.basic ? '36px' : '18px',
            height: this.basic ? '36px' : '18px',
            position: 'relative',
            top: this.basic ? undefined : '3px',
            marginRight: this.label ? '6px' : undefined,
          })}
          src="${this.loading ? LOADER : this.img ? this.img : null}"
        />
        <span>${this.label}</span>
      </button>`
    }
  }
}
