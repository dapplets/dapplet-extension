import { serialize } from 'borsh'
import * as nearAPI from 'near-api-js'
import { NotImplementedError } from '../../../common/errors'
import { browserStorage_set, initBGFunctions } from '../../communication'
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
    const { getCurrentTab, createTab, waitClosingTab } = initBGFunctions()
    const currentTab = await getCurrentTab()
    const currentUrl = new URL(currentTab.url)
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
        this._authData?.accountId,
        this._app,
        this._near.config.networkId
      )
    }
    return this._connectedAccount
  }
}
