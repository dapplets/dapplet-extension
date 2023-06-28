import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { description } from './description'
import LOADER from './loader.svg'

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
  // public static override styles = styles
  public static widgetParamsDescription = description

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
    // ToDo: do not use insPointName
    if (this.insPointName === 'POST' || this.insPointName === 'QUOTE_POST') {
      return html`
        <div
          class="wrapper-button button-direction"
          @click=${this._clickHandler}
          title=${this.tooltip}
          style=${styleMap({
            marginTop: this.insPointName === 'QUOTE_POST' ? '12px' : undefined,
          })}
        >
          <div
            role="button"
            tabindex="0"
            class="wrapper-button dapplet-widget-post-button"
            data-testid="reply"
            style=${styleMap({ opacity: this.disabled ? '.5' : '1' })}
          >
            <div dir="ltr" class="button-block button-display button-transition-duration">
              <div class="wrapper-button button-secondary-block">
                <div
                  class="wrapper-button button-block-secondary button-border-radius button-border button-secondary-block button-transition-duration"
                ></div>
                <img
                  height="18"
                  src="${this.loading ? LOADER : this.img || null}"
                  class="button-img-display"
                />
              </div>
              ${this.label?.toString() &&
              html`<div class="wrapper-button button-secondary-block button-label-overflow">
                <span
                  data-testid="app-text-transition-container"
                  class="button-block button-label-block"
                >
                  ${this.label}
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
