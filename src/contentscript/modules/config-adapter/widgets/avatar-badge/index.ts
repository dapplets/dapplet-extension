import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import description from './description'
import { IAvatarBadgeState, IConnectedAccountUser } from './types'

class AvatarBadge extends LitElement implements IAvatarBadgeState {
  // public static override styles = styles
  public static widgetParamsDescription = description

  @property() state: IAvatarBadgeState
  @property() insPointName: string
  @property() img?: string | null
  @property() video?: string
  @property() mediaType?: string
  @property() basic?: boolean
  @property() vertical: 'top' | 'bottom'
  @property() horizontal: 'left' | 'right'
  @property() hidden: boolean
  @property() tooltip?: string | string[]
  @property() theme?: 'DARK' | 'LIGHT'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property() exec?: (ctx: any, me: IAvatarBadgeState) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property() init?: (tx: any, me: IAvatarBadgeState) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @property() ctx: any
  @property() username: string
  @property() accounts?: IConnectedAccountUser[]
  @property() showAccounts?: boolean

  connectedCallback() {
    super.connectedCallback()
    this.init?.(this.ctx, this.state)
  }

  private _clickHandler(e) {
    this.exec?.(this.ctx, this.state)
    e.stopPropagation()
  }

  override render() {
    if (this.hidden || !(this.img || this.video)) return null

    return html`<div
      class="avatar-badge"
      @click=${this._clickHandler}
      title=${this.tooltip
        ? typeof this.tooltip === 'string'
          ? this.tooltip
          : this.tooltip.join('\n')
        : ''}
    >
      <div
        class=${classMap({
          wrapper: true,
          active: !!this.exec,
          badge: true,
          'not-basic': !this.basic,
          dark: this.theme === 'DARK',
          'top-left': this.vertical === 'top' && this.horizontal === 'left',
          'top-right': this.vertical === 'top' && this.horizontal === 'right',
          'bottom-left': this.vertical === 'bottom' && this.horizontal === 'left',
          'bottom-right': this.vertical === 'bottom' && this.horizontal === 'right',
        })}
      >
        ${this.img &&
        (this.mediaType === undefined || this.mediaType !== 'application/octet-stream')
          ? html`<img src=${this.img} style=${styleMap({ width: '100%' })} />`
          : this.video ?? (this.img && this.mediaType === 'application/octet-stream')
          ? html`<video
              src=${this.video ?? this.img}
              autoplay
              muted
              loop
              style=${styleMap({ width: '100%' })}
            />`
          : ''}
      </div>
    </div>`
  }
}

export { AvatarBadge, IAvatarBadgeState }
