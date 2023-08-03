import { ethers } from 'ethers'
import * as nearAPI from 'near-api-js'
import { Near } from 'near-api-js'
import { JsonRpcProvider } from 'near-api-js/lib/providers'
import browser from 'webextension-polyfill'
import { NotImplementedError } from '../../../../common/errors'
import { generateGuid } from '../../../../common/generateGuid'
import { CacheMethod, waitTab } from '../../../../common/helpers'
import * as walletIcons from '../../../../common/resources/wallets'
import { NearNetworkConfig } from '../../../../common/types'
import { truncateEthAddress } from '../../../../contentscript/overlay/root/helpers/truncateEthAddress'
import { NearWallet } from '../interface'
import { CustomWalletConnection } from './customWalletConnection'

export default class implements NearWallet {
  private __nearWallet: CustomWalletConnection = null
  private _config: NearNetworkConfig
  private _lastUsageKey: string

  private get _nearWallet() {
    if (!this.__nearWallet) {
      const near = new Near({
        ...this._config,
        deps: {
          keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
        },
      })

      this.__nearWallet = new CustomWalletConnection(near, this._config.networkId)
    }

    return this.__nearWallet
  }

  constructor(config: NearNetworkConfig) {
    this._config = config
    this._lastUsageKey = `near_${config.networkId}_lastUsage`
  }

  async getAddress(): Promise<string> {
    return this._nearWallet.getAccountId()
  }

  async getChainId() {
    return 0
  }

  async sendCustomRequest(method: string, params: any): Promise<any> {
    const provider: JsonRpcProvider = this._nearWallet.account().connection.provider as any
    return provider.sendJsonRpc(method, params)
  }

  async requestSignTransactions(transactions: any, callbackUrl: any) {
    return this._nearWallet.requestSignTransactions(transactions, callbackUrl)
  }

  connect(): ethers.Signer {
    throw new NotImplementedError()
  }

  async isAvailable() {
    return true
  }

  async isConnected() {
    const accountId = await this._nearWallet.getAccountId()
    return !!accountId && accountId.length > 0
  }

  @CacheMethod()
  async connectWallet(): Promise<void> {
    await this._connectBrowserWallet(this._nearWallet)
  }

  async createAccessKey(contractId: string, loginConfirmationId: string): Promise<void> {
    /*
        The `near-api-js` library does not support multiple access keys at the same time. 
        When you try to create a second access key with the specified contract 
        address, the first key is overwritten. Multiple key support is required 
        to implement the Core.login() and Core.session() APIs. To avoid overwriting 
        keys, we isolate the keystores within each login confirmation by prefixing 
        their localstorages. This allowed us to separate keys from different login 
        confirmations, which can be generated from different dapplets and for different contracts.
    */

    const keyPrefix = `login-confirmation:${loginConfirmationId}:`

    const near = new Near({
      ...this._config,
      deps: {
        keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(
          browser.storage.local,
          keyPrefix
        ),
      },
    })

    const nearWallet = new CustomWalletConnection(near, this._config.networkId)

    await this._connectBrowserWallet(nearWallet, contractId)
  }

  async disconnectWallet() {
    this._nearWallet.signOut()
  }

  async getMeta() {
    return {
      name: 'NEAR Wallet',
      description: 'NEAR Wallet',
      icon: walletIcons['near'],
    }
  }

  async getLastUsage() {
    return (await browser.storage.local.get(this._lastUsageKey))[this._lastUsageKey]
  }

  getAccount() {
    return this._nearWallet.account()
  }

  async signMessage(): Promise<string> {
    throw new NotImplementedError()
  }

  private async _connectBrowserWallet(nearWallet: CustomWalletConnection, contractId?: string) {
    // ToDo: why this function became async?
    const expectedAccountId = await nearWallet.getAccountId()

    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })
    const currentTabId = currentTab.id

    const requestId = generateGuid()
    const callbackUrl = browser.runtime.getURL(`callback.html?request_id=${requestId}`)

    let callbackTab = null
    const waitTabPromise = waitTab(callbackUrl).then((x) => (callbackTab = x))
    const requestPromise = nearWallet.requestSignIn({
      contractId,
      successUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=true`),
      failureUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=false`),
    })

    await Promise.race([waitTabPromise, requestPromise])

    await browser.tabs.update(currentTabId, { active: true })

    if (!callbackTab) throw new Error('Wallet connection request rejected.')

    await browser.tabs.remove(callbackTab.id)

    const urlObject = new URL(callbackTab.url)
    const success = urlObject.searchParams.get('success') === 'true'

    if (!success) throw new Error('Wallet connection request rejected')

    const accountId = urlObject.searchParams.get('account_id')
    const publicKey = urlObject.searchParams.get('public_key')
    const allKeys = urlObject.searchParams.get('all_keys')

    // TODO: Handle situation when access key is not added
    if (!accountId) throw new Error('No account_id params in callback URL')

    if (expectedAccountId !== '' && contractId && expectedAccountId !== accountId) {
      throw new Error(
        `Account ${truncateEthAddress(expectedAccountId)} was expected, but ${truncateEthAddress(
          accountId,
          24
        )} is connected`
      )
    }

    nearWallet.completeSignIn(accountId, publicKey, allKeys)
    browser.storage.local.set({ [this._lastUsageKey]: new Date().toISOString() })
  }
}
