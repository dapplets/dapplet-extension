import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
import * as ethereum from '../ethereum'
import * as near from '../near'

export class LoginSession {
  sessionId: string = null
  moduleName: string = null
  authMethod: string = null
  walletType: string = null
  expiresAt: string = null
  createdAt: string = null
  loginConfirmationId?: string = null

  logoutHandler?: (ls: any) => void

  private get _network() {
    return this.authMethod.split('/')[0] // ethereum, near
  }

  private get _chain() {
    return this.authMethod.split('/')[1] // goerli, testnet, mainnet, xdai
  }

  private get _isExpired() {
    const expiresAt = new Date(this.expiresAt).getTime()
    const now = Date.now()
    return expiresAt < now
  }

  constructor(serializedSession: any) {
    Object.assign(this, serializedSession)
  }

  async isValid(): Promise<boolean> {
    if (this._isExpired) return false
    const { isValidSession } = await initBGFunctions(browser)
    return await isValidSession(this.sessionId)
  }

  async logout() {
    const { killSession } = await initBGFunctions(browser)
    await killSession(this.sessionId)
    const ls = {} // ToDo: specify session
    this.logoutHandler?.call({}, ls)
  }

  async wallet(): Promise<any> {
    if (!(await this.isValid())) return null
    return this._getWalletObject()
  }

  async contract(address: string, options: any): Promise<any> {
    if (this._network === 'ethereum') {
      return ethereum.createContractWrapper(
        this.sessionId,
        { network: this._chain },
        address,
        options
      )
    } else if (this._network === 'near') {
      return near.createContractWrapper(
        this.sessionId,
        {
          network: this._chain,
          loginConfirmationId: this.loginConfirmationId,
        },
        address,
        options
      )
    } else {
      throw new Error(
        `Current auth method "${this._network}" doesn't support contract interactions.`
      )
    }
  }

  async getItem(key: string): Promise<any> {
    const { getSessionItem } = await initBGFunctions(browser)
    return getSessionItem(this.sessionId, key)
  }

  async setItem(key: string, value: any): Promise<void> {
    const { setSessionItem } = await initBGFunctions(browser)
    return setSessionItem(this.sessionId, key, value)
  }

  async removeItem(key: string): Promise<void> {
    const { removeSessionItem } = await initBGFunctions(browser)
    return removeSessionItem(this.sessionId, key)
  }

  async clear(): Promise<void> {
    const { clearSessionItems } = await initBGFunctions(browser)
    return clearSessionItems(this.sessionId)
  }

  private async _getWalletObject() {
    if (this._network === 'ethereum') {
      // ToDo: events def
      return ethereum.createWalletConnection(this.moduleName, { network: this._chain })
    } else if (this._network === 'near') {
      return near.createWalletConnection(this.moduleName, {
        network: this._chain,
        loginConfirmationId: this.loginConfirmationId,
      })
    } else {
      throw new Error(`Current auth method "${this._network}" doesn't support wallet connections.`)
    }
  }
}
