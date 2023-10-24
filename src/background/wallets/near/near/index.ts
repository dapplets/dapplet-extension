import { Account, Optional, Transaction, VerifiedOwner } from '@near-wallet-selector/core'
import { createAction } from '@near-wallet-selector/wallet-utils'
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
import {
  BrowserWalletSignAndSendTransactionParams,
  BrowserWalletSignInParams,
  NearWallet,
} from '../interface'
import { CustomConnectedWalletAccount } from './customConnectedWalletAccount'
import { CustomWalletConnection } from './customWalletConnection'
import { WebExtensionKeyStorage } from './webExtensionKeyStorage'

const LOCAL_STORAGE_KEY_SUFFIX = '_wallet_auth_key'

/**
 * Based on https://github.com/near/wallet-selector/blob/ab180d8117f6a811bfe825ff8ccbdec57d174dc0/packages/my-near-wallet/src/lib/my-near-wallet.ts
 */
export default class implements NearWallet {
  private _config: NearNetworkConfig
  private _lastUsageKey: string

  private _statePromise: Promise<{
    wallet: CustomWalletConnection
    keyStore: WebExtensionKeyStorage
  }>

  constructor(config: NearNetworkConfig) {
    this._config = config
    this._lastUsageKey = `near_${config.networkId}_lastUsage`
    this._statePromise = this._setupWalletState()
  }

  // ToDo: For compatibility with GenericWallet interface. Need to be refactored.
  async getAddress(): Promise<string> {
    const accounts = await this.getAccounts()
    return accounts[0]?.accountId ?? ''
  }

  // ToDo: For compatibility with GenericWallet interface. Need to be refactored.
  async getChainId() {
    return 0
  }

  async sendCustomRequest(method: string, params: any): Promise<any> {
    const account = await this.getAccount()
    const provider: JsonRpcProvider = account.connection.provider as any
    return provider.sendJsonRpc(method, params)
  }

  async signIn({
    contractId,
    methodNames,
    successUrl,
    failureUrl,
  }: BrowserWalletSignInParams): Promise<Account[]> {
    const _state = await this._statePromise
    const existingAccounts = await this.getAccounts()

    if (existingAccounts.length) {
      return existingAccounts
    }

    await _state.wallet.requestSignIn({
      contractId,
      methodNames,
      successUrl,
      failureUrl,
    })

    return this.getAccounts()
  }

  async signOut(): Promise<void> {
    const _state = await this._statePromise
    if (_state.wallet.isSignedIn()) {
      _state.wallet.signOut()
    }
  }

  async getAccount(): Promise<CustomConnectedWalletAccount> {
    const _state = await this._statePromise
    return _state.wallet.account()
  }

  async getAccounts(): Promise<Account[]> {
    const _state = await this._statePromise

    const accountId = _state.wallet.getAccountId()
    const account = _state.wallet.account()

    if (!accountId || !account) {
      return []
    }

    const publicKey = await account.connection.signer.getPublicKey(
      account.accountId,
      this._config.networkId
    )
    return [
      {
        accountId,
        publicKey: publicKey ? publicKey.toString() : '',
      },
    ]
  }

  verifyOwner(): Promise<void | VerifiedOwner> {
    throw new Error('Method not implemented.')
  }

  async signAndSendTransaction({
    receiverId,
    actions,
  }: BrowserWalletSignAndSendTransactionParams): Promise<void | nearAPI.providers.FinalExecutionOutcome> {
    const _state = await this._statePromise

    const account = _state.wallet.account()

    return account.signAndSendTransaction({
      receiverId: receiverId,
      actions: actions.map((action) => createAction(action)),
    })
  }

  async signAndSendTransactions({ transactions }) {
    // ToDo: implement batch transactions
    if (transactions.length > 1) {
      throw new Error('Batch transactions are not implemented')
    }

    const [transaction] = transactions

    const _state = await this._statePromise

    const account = _state.wallet.account()

    await account.signAndSendTransaction({
      receiverId: transaction.receiverId,
      actions: transaction.actions.map((action) => createAction(action)),
    })
  }

  buildImportAccountsUrl(): string {
    return `${this._config.walletUrl}/batch-import`
  }

  connect(): ethers.Signer {
    throw new NotImplementedError()
  }

  async isAvailable() {
    return true
  }

  async isConnected() {
    const accounts = await this.getAccounts()
    return accounts.length > 0
  }

  @CacheMethod()
  async connectWallet(): Promise<void> {
    const _state = await this._statePromise
    await this._connectBrowserWallet(_state.wallet)
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
      walletUrl: this._config.walletUrl,
      networkId: this._config.networkId,
      nodeUrl: this._config.nodeUrl,
      helperUrl: this._config.helperUrl,
      headers: {},
      deps: {
        keyStore: new WebExtensionKeyStorage(keyPrefix),
      },
    })

    const appKeyPrefix = this._config.networkId
    const authDataKey = appKeyPrefix + LOCAL_STORAGE_KEY_SUFFIX
    const authData = JSON.parse(
      (await browser.storage.local.get(authDataKey))[authDataKey] ?? 'null'
    )

    const nearWallet = new CustomWalletConnection(near, authData, authDataKey)

    await this._connectBrowserWallet(nearWallet, contractId)
  }

  async disconnectWallet() {
    const _state = await this._statePromise
    _state.wallet.signOut()
  }

  async getMeta() {
    return {
      name: 'MyNearWallet',
      description: 'MyNearWallet',
      icon: walletIcons['near'],
    }
  }

  async getLastUsage() {
    return (await browser.storage.local.get(this._lastUsageKey))[this._lastUsageKey]
  }

  async signMessage(): Promise<string> {
    throw new NotImplementedError()
  }

  private async _connectBrowserWallet(nearWallet: CustomWalletConnection, contractId?: string) {
    // ToDo: why this function became async?
    const expectedAccountId = await nearWallet.getAccountId()

    // ToDo: replace currentWindow with lastFocusedWindow
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

    nearWallet.completeSignIn(accountId, publicKey, allKeys) // ToDo: need to wait promise?
    browser.storage.local.set({ [this._lastUsageKey]: new Date().toISOString() })
  }

  private async _setupWalletState() {
    const keyStore = new WebExtensionKeyStorage()

    const near = new Near({
      walletUrl: this._config.walletUrl,
      networkId: this._config.networkId,
      nodeUrl: this._config.nodeUrl,
      helperUrl: this._config.helperUrl,
      headers: {},
      deps: { keyStore },
    })

    const appKeyPrefix = this._config.networkId
    const authDataKey = appKeyPrefix + LOCAL_STORAGE_KEY_SUFFIX
    const authData = JSON.parse(
      (await browser.storage.local.get(authDataKey))[authDataKey] ?? 'null'
    )

    // ToDo: replace this._config.networkId with app_key prefix
    const wallet = new CustomWalletConnection(near, authData, authDataKey)

    return {
      wallet,
      keyStore,
    }
  }

  private async _transformTransactions(transactions: Array<Optional<Transaction, 'signerId'>>) {
    const _state = await this._statePromise

    const account = _state.wallet.account()
    const { networkId, signer, provider } = account.connection

    const localKey = await signer.getPublicKey(account.accountId, networkId)

    return Promise.all(
      transactions.map(async (transaction, index) => {
        const actions = transaction.actions.map((action) => createAction(action))
        const accessKey = await account.accessKeyForTransaction(
          transaction.receiverId,
          actions,
          localKey
        )

        if (!accessKey) {
          throw new Error(
            `Failed to find matching key for transaction sent to ${transaction.receiverId}`
          )
        }

        const block = await provider.block({ finality: 'final' })

        return nearAPI.transactions.createTransaction(
          account.accountId,
          nearAPI.utils.PublicKey.from(accessKey.public_key),
          transaction.receiverId,
          accessKey.access_key.nonce + index + 1,
          actions,
          nearAPI.utils.serialize.base_decode(block.header.hash)
        )
      })
    )
  }
}
