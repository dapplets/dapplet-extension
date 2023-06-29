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

    return html`
      <div
        role="button"
        class=${classMap({
          'button-default': true,
          'wrapper-button': true,
          'button-direction': true,
          'container-button': true,
          'button-block': true,
          'button-display': true,
          'button-transition-duration': true,
          'button-light': this.theme === 'LIGHT',
          'button-dark': this.theme === 'DARK',
          'button-basic': this.basic,
        })}
        @click=${this._clickHandler}
        title=${this.tooltip}
        data-testid="reply"
        style=${styleMap({
          opacity: this.disabled ? '.5' : '1',
        })}
        ?disabled=${this.disabled}
      >
        <div style="display:flex;align-items:center;margin-right:12px" class="wrapper-button button-secondary-block">
          <div
            class="wrapper-button button-block-secondary button-border-radius button-border button-secondary-block button-transition-duration"
          ></div>
          <img src="${this.loading ? LOADER : this.img || null}" class="button-img-display" />
        </div>
        ${this.label?.toString() &&
        html`<div class="wrapper-button button-secondary-block button-label-overflow">
          <span data-testid="app-text-transition-container" class="button-block button-label-block">
            ${this.label}
          </span>
        </div>`}
      </div>
    `
  }
}
