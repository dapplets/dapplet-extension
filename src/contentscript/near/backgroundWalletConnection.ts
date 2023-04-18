import { serialize } from 'borsh'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as nearAPI from 'near-api-js'
import { browser } from 'webextension-polyfill-ts'
import { NotImplementedError } from '../../common/errors'
import { CustomConnectedWalletAccount } from './customConnectedWalletAccount'

export class BackgroundWalletConnection extends nearAPI.WalletConnection {
  constructor(near: nearAPI.Near, appKeyPrefix: string, private _app: string) {
    super(near, appKeyPrefix)
  }

  async requestSignIn() {
    throw new NotImplementedError()
  }

  async requestSignTransactions(
    transactions: nearAPI.transactions.Transaction[],
    callbackUrl?: string
  ) {
    const currentUrl = new URL(window.location.href)
    const newUrl = new URL('sign', this._walletBaseUrl)

    newUrl.searchParams.set(
      'transactions',
      transactions
        .map((transaction) => serialize(nearAPI.transactions.SCHEMA, transaction))
        .map((serialized) => Buffer.from(serialized).toString('base64'))
        .join(',')
    )
    newUrl.searchParams.set('callbackUrl', callbackUrl || currentUrl.href)
    newUrl.searchParams.set('referrer', 'Dapplets Extension')

    const { createTab, waitClosingTab } = await initBGFunctions(browser)
    const tab = await createTab(newUrl.toString())
    await waitClosingTab(tab.id, tab.windowId)
  }

  async completeSignIn(accountId, publicKey, allKeys) {
    if (accountId) {
      this._authData = {
        accountId,
        allKeys,
      }
      window.localStorage.setItem(this._authDataKey, JSON.stringify(this._authData))
      if (publicKey) {
        await this._moveKeyFromTempToPermanent(accountId, publicKey)
      }
    }
  }

  account() {
    if (!this._connectedAccount) {
      this._connectedAccount = new CustomConnectedWalletAccount(
        this,
        this._near.connection,
        this._authData.accountId,
        this._app,
        this._near.config.networkId
      )
    }
    console.log('*** this._connectedAccount', this._connectedAccount)
    return this._connectedAccount
  }
}
