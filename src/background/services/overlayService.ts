import browser from 'webextension-polyfill'
import { getCurrentTab } from '../../common/helpers'
import {
  ChainTypes,
  DefaultSigners,
  LoginRequest,
  SystemOverlayTabs,
  WalletTypes,
} from '../../common/types'

export class OverlayService {
  public pairWalletViaOverlay(
    chains: ChainTypes | ChainTypes[] | null,
    app: string | DefaultSigners,
    tabId: number
  ): Promise<void> {
    const arr = !chains
      ? [
          ChainTypes.ETHEREUM_SEPOLIA,
          ChainTypes.ETHEREUM_XDAI,
          ChainTypes.NEAR_MAINNET,
          ChainTypes.NEAR_TESTNET,
        ]
      : Array.isArray(chains)
      ? chains
      : [chains]
    const loginRequest = { authMethods: arr, secureLogin: 'disabled' }
    return this._openOverlay(
      'OPEN_SYSTEM_OVERLAY',
      { app, loginRequest },
      tabId,
      SystemOverlayTabs.LOGIN_SESSION
    )
  }

  public loginViaOverlay(payload: any, tabId: number): Promise<void> {
    return this._openOverlay('OPEN_SYSTEM_OVERLAY', payload, tabId, SystemOverlayTabs.LOGIN_SESSION)
  }

  public selectWalletViaOverlay(payload: any, tabId: number): Promise<void> {
    return this._openOverlay('OPEN_SYSTEM_OVERLAY', payload, tabId, SystemOverlayTabs.LOGIN_SESSION)
  }

  public openLoginSessionOverlay(
    app: string | DefaultSigners,
    loginRequest: LoginRequest,
    tabId: number
  ): Promise<{ wallet: WalletTypes; chain: ChainTypes; confirmationId?: string }> {
    return this._openOverlay(
      'OPEN_SYSTEM_OVERLAY',
      { app, loginRequest },
      tabId,
      SystemOverlayTabs.LOGIN_SESSION
    )
  }

  public openPopupOverlay(path: string, tabId?: number) {
    return this._openOverlay('OPEN_POPUP_OVERLAY', { path }, tabId)
  }

  public openDappletHome(moduleName: string, tabId: number) {
    return this._openOverlay('OPEN_DAPPLET_HOME', { moduleName }, tabId)
  }

  public openDappletAction(moduleName: string, tabId: number) {
    return this._openOverlay('OPEN_DAPPLET_ACTION', { moduleName }, tabId)
  }

  public execConnectedAccountsUpdateHandler(moduleName: string, tabId: number) {
    return this._openOverlay('EXEC_CA_UPDATE_HANDLER', { moduleName }, tabId)
  }

  public sendDataToPairingOverlay(topic: string, args: any[]) {
    return this._openOverlay('OPEN_PAIRING_OVERLAY', { topic, args })
  }

  public openConnectedAccountsPopup(
    {
      accountsToConnect,
      bunchOfAccountsToConnect,
      accountsToDisconnect,
      accountToChangeStatus,
      condition,
      network,
    },
    tabId: number
  ) {
    return this._openOverlay(
      'OPEN_SYSTEM_OVERLAY',
      {
        accountsToConnect,
        bunchOfAccountsToConnect,
        accountsToDisconnect,
        accountToChangeStatus,
        condition,
        loginRequest: 'yes',
        network,
      },
      tabId,
      SystemOverlayTabs.CONNECTED_ACCOUNTS
    )
  }

  private async _openOverlay(
    type: string,
    payload: any,
    tabId: number = null,
    activeTab?: SystemOverlayTabs
  ) {
    if (tabId === null) {
      const currentTab = await getCurrentTab()
      if (!currentTab) return
      tabId = currentTab.id
    }

    const hasLoginRequest = type === 'OPEN_SYSTEM_OVERLAY' && !!payload.loginRequest

    const response = await browser.tabs.sendMessage(tabId, {
      type,
      payload: hasLoginRequest ? { payload, activeTab } : payload,
    })

    // ToDo: use native throw in error
    if (response && response[0]) throw new Error(response[0])
    return response && response[1]
  }
}
