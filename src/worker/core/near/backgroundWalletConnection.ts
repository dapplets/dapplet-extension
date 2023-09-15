import { KeyStore } from '@near-js/keystores'
import { InMemorySigner } from '@near-js/signers'
import { SCHEMA, Transaction } from '@near-js/transactions'
import { serialize } from 'borsh'
import { Near } from 'near-api-js'
import { NotImplementedError } from '../../../common/errors'
import { browserStorage_set, initBGFunctions } from '../../communication'
import { CustomConnectedWalletAccount } from './customConnectedWalletAccount'

const PENDING_ACCESS_KEY_PREFIX = 'pending_key' // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)

interface RequestSignTransactionsOptions {
  transactions: Transaction[]
  callbackUrl?: string
  meta?: string
}

export class BackgroundWalletConnection {
  _walletBaseUrl: string
  _authDataKey: string
  _keyStore: KeyStore
  _authData: { accountId?: string; allKeys?: string[] }
  _networkId: string
  _near: Near
  _connectedAccount: CustomConnectedWalletAccount
  _completeSignInPromise: Promise<void>

  constructor(near: Near, authData: any, private _app: string) {
    this._near = near
    this._networkId = near.config.networkId
    this._walletBaseUrl = near.config.walletUrl
    this._keyStore = (near.connection.signer as InMemorySigner).keyStore
    this._authData = authData || { allKeys: [] }
    this._authDataKey = _app
  }

  isSignedIn() {
    return !!this._authData.accountId
  }

  async isSignedInAsync() {
    if (!this._completeSignInPromise) {
      return this.isSignedIn()
    }

    await this._completeSignInPromise
    return this.isSignedIn()
  }

  getAccountId() {
    return this._authData.accountId || ''
  }

  async requestSignIn() {
    throw new NotImplementedError()
  }

  async requestSignTransactions({
    transactions,
    meta,
    callbackUrl,
  }: RequestSignTransactionsOptions): Promise<void> {
    const { getCurrentTab, createTab, waitClosingTab } = initBGFunctions()
    const currentTab = await getCurrentTab()
    const currentUrl = new URL(currentTab.url)
    const newUrl = new URL('sign', this._walletBaseUrl)

    newUrl.searchParams.set(
      'transactions',
      transactions
        .map((transaction) => serialize(SCHEMA, transaction))
        .map((serialized) => Buffer.from(serialized).toString('base64'))
        .join(',')
    )
    newUrl.searchParams.set('callbackUrl', callbackUrl || currentUrl.href)
    newUrl.searchParams.set('referrer', 'Dapplets Extension')

    if (meta) newUrl.searchParams.set('meta', meta)

    const tab = await createTab(newUrl.toString())
    await waitClosingTab(tab.id, tab.windowId)
  }

  async completeSignIn(accountId, publicKey, allKeys) {
    if (accountId) {
      this._authData = {
        accountId,
        allKeys,
      }

      await browserStorage_set({ [this._authDataKey]: JSON.stringify(this._authData) })

      // It fixes the error "Cannot find matching key for transaction sent to <account_id>"
      if (this._connectedAccount) {
        Object.defineProperty(this._connectedAccount, 'accountId', {
          value: accountId,
          writable: true,
        })
      }

      if (publicKey) {
        await this._moveKeyFromTempToPermanent(accountId, publicKey)
      }
    }
  }

  async _moveKeyFromTempToPermanent(accountId: string, publicKey: string) {
    const keyPair = await this._keyStore.getKey(
      this._networkId,
      PENDING_ACCESS_KEY_PREFIX + publicKey
    )
    await this._keyStore.setKey(this._networkId, accountId, keyPair)
    await this._keyStore.removeKey(this._networkId, PENDING_ACCESS_KEY_PREFIX + publicKey)
  }

  signOut() {
    throw new NotImplementedError()
  }

  account() {
    if (!this._connectedAccount) {
      this._connectedAccount = new CustomConnectedWalletAccount(
        this,
        this._near.connection,
        this._authData?.accountId,
        this._app,
        this._near.config.networkId
      )
    }
    return this._connectedAccount
  }
}
