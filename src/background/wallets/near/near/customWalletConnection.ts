import { KeyPair } from '@near-js/crypto'
import { KeyStore } from '@near-js/keystores'
import { InMemorySigner } from '@near-js/signers'
import { SCHEMA, Transaction } from '@near-js/transactions'
import { serialize } from 'borsh'
import { Near } from 'near-api-js'
import browser from 'webextension-polyfill'
import { waitClosingTab } from '../../../../common/helpers'
import { CustomConnectedWalletAccount } from './customConnectedWalletAccount'

const LOGIN_WALLET_URL_SUFFIX = '/login/'
const PENDING_ACCESS_KEY_PREFIX = 'pending_key' // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)

interface SignInOptions {
  contractId?: string
  methodNames?: string[]
  // TODO: Replace following with single callbackUrl
  successUrl?: string
  failureUrl?: string
}

interface RequestSignTransactionsOptions {
  transactions: Transaction[]
  callbackUrl?: string
  meta?: string
}

export class CustomWalletConnection {
  _walletBaseUrl: string
  _authDataKey: string
  _keyStore: KeyStore
  _authData: { accountId?: string; allKeys?: string[] }
  _networkId: string
  _near: Near
  _connectedAccount: CustomConnectedWalletAccount
  _completeSignInPromise: Promise<void>

  constructor(near: Near, authData: any, authDataKey: string) {
    this._near = near
    this._networkId = near.config.networkId
    this._walletBaseUrl = near.config.walletUrl
    this._keyStore = (near.connection.signer as InMemorySigner).keyStore
    this._authData = authData || { allKeys: [] }
    this._authDataKey = authDataKey
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

  async requestSignIn({ contractId, methodNames, successUrl, failureUrl }: SignInOptions) {
    const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    const currentUrl = new URL(tabs?.[0]?.url)
    const newUrl = new URL(this._walletBaseUrl + LOGIN_WALLET_URL_SUFFIX)
    newUrl.searchParams.set('success_url', successUrl || currentUrl.href)
    newUrl.searchParams.set('failure_url', failureUrl || currentUrl.href)
    if (contractId) {
      /* Throws exception if contract account does not exist */
      const contractAccount = await this._near.account(contractId)
      await contractAccount.state()

      newUrl.searchParams.set('contract_id', contractId)
      const accessKey = KeyPair.fromRandom('ed25519')
      newUrl.searchParams.set('public_key', accessKey.getPublicKey().toString())
      await this._keyStore.setKey(
        this._networkId,
        PENDING_ACCESS_KEY_PREFIX + accessKey.getPublicKey(),
        accessKey
      )
    }

    if (methodNames) {
      methodNames.forEach((methodName) => {
        newUrl.searchParams.append('methodNames', methodName)
      })
    }

    const tab = await browser.tabs.create({ url: newUrl.toString() })
    await waitClosingTab(tab.id, tab.windowId)
  }

  async requestSignTransactions({
    transactions,
    meta,
    callbackUrl,
  }: RequestSignTransactionsOptions): Promise<void> {
    const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    const currentUrl = new URL(tabs?.[0]?.url)
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

    const tab = await browser.tabs.create({ url: newUrl.toString() })
    await waitClosingTab(tab.id, tab.windowId)
  }

  async completeSignIn(accountId, publicKey, allKeys) {
    if (accountId) {
      this._authData = {
        accountId,
        allKeys,
      }

      await browser.storage.local.set({ [this._authDataKey]: JSON.stringify(this._authData) })

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
    this._authData = {}
    browser.storage.local.remove(this._authDataKey)
  }

  account() {
    if (!this._connectedAccount) {
      this._connectedAccount = new CustomConnectedWalletAccount(
        this as any, // ToDo: _completeSignInWithAccessKey is not implemented
        this._near.connection,
        this._authData.accountId
      )
    }
    return this._connectedAccount
  }
}
