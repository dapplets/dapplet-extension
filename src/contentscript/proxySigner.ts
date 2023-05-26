import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as ethers from 'ethers'
import browser from 'webextension-polyfill'
import { NotImplementedError } from '../common/errors'
import { ChainTypes } from '../common/types'

export class ProxySigner extends ethers.Signer {
  public provider = new ethers.providers.Web3Provider((method, params) =>
    initBGFunctions(browser).then((f) => f.fetchJsonRpc(this._chain, method, params))
  )

  constructor(private _app: string, private _chain: ChainTypes) {
    super()
  }

  connect(): ethers.ethers.Signer {
    throw new NotImplementedError()
  }

  async getAddress(): Promise<string> {
    const { getAddress } = await initBGFunctions(browser)
    return getAddress(this._app, this._chain)
  }

  async signMessage(): Promise<string> {
    throw new NotImplementedError()
  }

  async signTransaction(): Promise<string> {
    throw new NotImplementedError()
  }

  async sendTransaction(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    const { eth_sendTransactionOutHash } = await initBGFunctions(browser)
    const txHash = await eth_sendTransactionOutHash(this._app, this._chain, transaction)

    // the wait of a transaction from another provider can be long
    let tx = null
    while (tx === null) {
      await new Promise((res) => setTimeout(res, 1000))
      tx = await this.provider.getTransaction(txHash)
    }

    return tx
  }
}
