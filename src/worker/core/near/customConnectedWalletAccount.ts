import { FinalExecutionOutcome } from '@near-wallet-selector/core'
import BN from 'bn.js'
import { baseDecode } from 'borsh'
import { ConnectedWalletAccount, Connection } from 'near-api-js'
import { SignAndSendTransactionOptions } from 'near-api-js/lib/account'
import { AccessKeyView } from 'near-api-js/lib/providers/provider'
import { createTransaction } from 'near-api-js/lib/transaction'
import { PublicKey } from 'near-api-js/lib/utils'
import { generateGuid } from '../../../common/generateGuid'
import { browserStorage_get, getURL, initBGFunctions } from '../../communication'
import { BackgroundWalletConnection } from './backgroundWalletConnection'

export class CustomConnectedWalletAccount extends ConnectedWalletAccount {
  accountId: string

  /** @hidden */
  accessKeyByPublicKeyCache: { [key: string]: AccessKeyView } = {}

  constructor(
    walletConnection: BackgroundWalletConnection,
    connection: Connection,
    accountId: string,
    private _app: string,
    private _network: string
  ) {
    super(walletConnection as any, connection, accountId)
  }

  async signAndSendTransaction({
    receiverId,
    actions,
    walletMeta,
  }: SignAndSendTransactionOptions): Promise<FinalExecutionOutcome> {
    //if (!this.accountId) {
    const { prepareWalletFor } = initBGFunctions()
    // ToDo: remove it?
    // await prepareWalletFor(this._app, 'near/' + this._network, null);

    const authDataKey = this._network + '_wallet_auth_key'
    let authData = JSON.parse((await browserStorage_get(authDataKey))[authDataKey] ?? 'null')
    if (!authData) {
      await prepareWalletFor(this._app, 'near/' + this._network, null, null, null)
      authData = JSON.parse((await browserStorage_get(authDataKey))[authDataKey] ?? 'null')
    }

    if (!authData) {
      throw new Error('Wallet is not connected')
    }

    this.walletConnection._authData = authData
    this.accountId = authData.accountId
    //}

    const localKey = await this.connection.signer.getPublicKey(
      this.accountId,
      this.connection.networkId
    )
    let accessKey = await this.accessKeyForTransaction(receiverId, actions, localKey)
    if (!accessKey) {
      throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`)
    }

    if (localKey && localKey.toString() === accessKey.public_key) {
      try {
        // walletCallbackUrl is null to prevent calling of walletCallbackUrl = window.location.href (window is undefined in web workers)
        // at https://github.com/near/near-api-js/blob/53ba3f21c6da503e971a251b205bf50ea8b36dd0/packages/wallet-account/src/wallet_account.ts#L306
        return await super.signAndSendTransaction({
          receiverId,
          actions,
          walletCallbackUrl: null,
        })
      } catch (e) {
        if (e.type === 'NotEnoughAllowance') {
          accessKey = await this.accessKeyForTransaction(receiverId, actions)
        } else {
          throw e
        }
      } finally {
        // clear keys cached in this.findAccessKey method to prevent inconsistent nonce
        delete this.accessKeyByPublicKeyCache[accessKey.public_key]
      }
    }

    const block = await this.connection.provider.block({ finality: 'final' })
    const blockHash = baseDecode(block.header.hash)

    const publicKey = PublicKey.from(accessKey.public_key)
    // TODO: Cache & listen for nonce updates for given access key
    const nonce = accessKey.access_key.nonce.add(new BN(1))
    const transaction = createTransaction(
      this.accountId,
      publicKey,
      receiverId,
      nonce,
      actions,
      blockHash
    )

    const requestId = generateGuid()
    const callbackUrl = await getURL(`callback.html?request_id=${requestId}`)

    const { waitTab, removeTab, updateTab, queryTab } = initBGFunctions()
    const [currentTab] = await queryTab({ active: true, currentWindow: true })

    let callbackTab = null
    const waitTabPromise = waitTab(callbackUrl).then((x) => (callbackTab = x))
    const requestPromise = this.walletConnection.requestSignTransactions({
      transactions: [transaction],
      meta: walletMeta,
      callbackUrl,
    })

    await Promise.race([waitTabPromise, requestPromise])

    if (!callbackTab) throw new Error(`User rejected the transaction.`)

    await updateTab(currentTab.id, { active: true })
    await removeTab(callbackTab.id)

    const callbackTabUrlObject = new URL(callbackTab.url)
    const transactionHashes = callbackTabUrlObject.searchParams.get('transactionHashes')
    const errorCode = callbackTabUrlObject.searchParams.get('errorCode')

    if (errorCode || !transactionHashes) {
      throw new Error(`User rejected the transaction.`)
    }

    const txHash = baseDecode(transactionHashes)
    const txStatus = await this.walletConnection._near.connection.provider.txStatus(
      txHash,
      this.accountId
    )

    return txStatus

    // TODO: Aggregate multiple transaction request with "debounce".
    // TODO: Introduce TrasactionQueue which also can be used to watch for status?
  }
}
