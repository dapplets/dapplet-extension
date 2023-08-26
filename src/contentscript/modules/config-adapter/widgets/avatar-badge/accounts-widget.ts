import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import description from './description'
import { resources } from './resources'
import COPIED from './assets/copied.svg'
import COPY from './assets/copy.svg'
import { IAccountsWidgetState, IAvatarBadgeState, IConnectedAccountUser } from './types'

class AccountsWidget extends LitElement implements IAccountsWidgetState {
  // public static override styles = styles
  public static widgetParamsDescription = description

 
  @property() username: string
  @property() accounts: IConnectedAccountUser[]
  @property() showAccounts: boolean
  @property() top: string

  private _clickAccountHandler = (account: IConnectedAccountUser) => (e: PointerEvent) => {
    e.preventDefault()
    window.open(resources[account.origin].uri(account.name), '_blank')
  }

  private _clickCopyHandler = (account: IConnectedAccountUser) => (e: PointerEvent) => {
    e.preventDefault()
    const image = <HTMLImageElement>e.target
    navigator.clipboard.writeText(account.name)
    image.src = COPIED
    setTimeout(() => {
      image.src = COPY
    }, 600)
  }

  override render() {
   

    return  html`<div
    class=${`dapplets-connected-accounts-wrapper dapplets-connected-accounts-wrapper-${this.username}`}
    style=${styleMap({
      visibility: this.showAccounts ? 'visible' : 'hidden',
      opacity: this.showAccounts ? '1' : '0',
      top: this.top,
    })}
  >
    <div class="accounts">
      ${this.accounts.map(
        (account) =>
          html`<div class="account-container">
            <div
              class=${classMap({ account: true, nameUserActive: account.accountActive })}
              title=${'Go to the ' + resources[account.origin].pageName}
              @click=${this._clickAccountHandler(account)}
            >
              <img src=${resources[account.origin].icon} class="imgUser" />
              <h4 class="nameUser">${account.name}</h4>
            </div>
            <a class="copy-button" title="copy ID" @click=${this._clickCopyHandler(account)}>
              <img src=${COPY} class="copy-icon" alt="copy button" />
            </a>
          </div>`
      )}
    </div>
  </div>`
  }
}

export { AccountsWidget, IAvatarBadgeState }
