import { ethers } from 'ethers'
import * as nearAPI from 'near-api-js'
import { Near } from 'near-api-js'
import { JsonRpcProvider } from 'near-api-js/lib/providers'
import { browser } from 'webextension-polyfill-ts'
import { NotImplementedError } from '../../../../common/errors'
import { CacheMethod, generateGuid, waitTab } from '../../../../common/helpers'
import { NearNetworkConfig } from '../../../../common/types'
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
    console.log('into the NearWallet constructor')
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
    console.log('into the sendCustomRequest()')
    console.log('method', method)
    console.log('params', params)
    const provider: JsonRpcProvider = this._nearWallet.account().connection.provider as any
    console.log('provider', provider)
    return provider.sendJsonRpc(method, params)
  }

  async requestSignTransactions(transactions: any, callbackUrl: any) {
    console.log('into the requestSignTransactions()')
    return this._nearWallet.requestSignTransactions(transactions, callbackUrl)
  }

  // async signAndSendTransaction(
  //   receiverId: string,
  //   actions: nearAPI.transactions.Action[]
  // ): Promise<nearAPI.providers.FinalExecutionOutcome> {
  //   console.log('into the NearWallet/signAndSendTransaction()')
  //   return this._nearWallet.getConnectedAccount().signAndSendTransaction(receiverId, actions)
  // }

  connect(): ethers.Signer {
    throw new NotImplementedError()
  }

  async isAvailable() {
    return true
  }

  async isConnected() {
    const accountId = this._nearWallet.getAccountId()
    return !!accountId && accountId.length > 0
  }

  @CacheMethod()
  async connectWallet({ contractId }: { contractId?: string }): Promise<void> {
    console.log('into the connectWallet()')
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })
    const currentTabId = currentTab.id

    const requestId = generateGuid()
    const callbackUrl = browser.runtime.getURL(`callback.html?request_id=${requestId}`)

    let callbackTab = null
    const waitTabPromise = waitTab(callbackUrl).then((x) => (callbackTab = x))
    const requestPromise = this._nearWallet.requestSignIn({
      contractId: contractId || 'dev-1674551865700-67703371677231',
      successUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=true`),
      failureUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=false`),
    })

    const response = await Promise.race([waitTabPromise, requestPromise])
    console.log('response', response)

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

    console.log('urlObject', urlObject)
    this._nearWallet.completeSignIn(accountId, publicKey, allKeys)
    localStorage[this._lastUsageKey] = new Date().toISOString()
  }

  async disconnectWallet() {
    this._nearWallet.signOut()
  }

  async getMeta() {
    return {
      name: 'NEAR Wallet',
      description: 'NEAR Wallet',
      icon: 'https://near.org/wp-content/themes/near-19/assets/downloads/near_icon.svg',
    }
  }

  getLastUsage() {
    return localStorage[this._lastUsageKey]
  }

  getAccount() {
    return this._nearWallet.account()
  }

  async signMessage(): Promise<string> {
    throw new NotImplementedError()
  }
}
