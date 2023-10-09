import { Provider, TransactionRequest } from '@ethersproject/providers'
import { ethers } from 'ethers'
import browser from 'webextension-polyfill'
import * as walletIcons from '../../../common/resources/wallets'
import { EthereumWallet } from './interface'

export default class extends ethers.Signer implements EthereumWallet {
  public provider: ethers.providers.StaticJsonRpcProvider
  private _wallet: ethers.Wallet = null

  constructor(config: { providerUrl: string; chainId: number }) {
    super()
    this.provider = new ethers.providers.StaticJsonRpcProvider(config.providerUrl, config.chainId)
  }

  async getAddress(): Promise<string> {
    await this._initWallet()
    if (!this._wallet) return null
    return this._wallet.getAddress()
  }

  async signMessage(message: string | ethers.utils.Bytes): Promise<string> {
    await this._initWallet()
    if (!this._wallet) throw new Error('Wallet is not connected')
    return this._wallet.signMessage(message)
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    await this._initWallet()
    if (!this._wallet) throw new Error('Wallet is not connected')
    return this._wallet.signTransaction(transaction)
  }

  connect(provider: Provider): ethers.Signer {
    if (!this._wallet) throw new Error('Wallet is not connected')
    return this._wallet.connect(provider)
  }

  async sendTransaction(
    transaction: TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    await this._initWallet()
    if (!this._wallet) throw new Error('Wallet is not connected')
    await browser.storage.local.set({ dapplets_lastUsage: new Date().toISOString() })
    return this._wallet.sendTransaction(transaction)
  }

  async sendTransactionOutHash(transaction: TransactionRequest): Promise<string> {
    await this._initWallet()
    if (!this._wallet) throw new Error('Wallet is not connected')
    await browser.storage.local.set({ dapplets_lastUsage: new Date().toISOString() })
    const tx = await this._wallet.sendTransaction(transaction)
    return tx.hash
  }

  async sendCustomRequest(method: string, params: any[]): Promise<any> {
    await this._initWallet()
    if (method === 'eth_sendTransaction') {
      return this.sendTransactionOutHash(params[0] as any)
    } else if (method === 'eth_accounts') {
      const address = await this.getAddress()
      return [address]
    } else {
      if (!this._wallet) throw new Error('Wallet is not connected')
      return this.provider.send(method, params)
    }
  }

  async isAvailable() {
    return true
  }

  async isConnected() {
    return !!(await browser.storage.local.get('dapplets_privateKey')).dapplets_privateKey
  }

  async connectWallet(): Promise<void> {
    await this._initWallet()
    let privateKey = (await browser.storage.local.get('dapplets_privateKey')).dapplets_privateKey
    if (!privateKey) {
      await browser.storage.local.set({
        dapplets_privateKey: '0xa2534f06a9bb510aee4e7e49cbfe0a431ced7aa184dace10a57d1754aeb4c874',
      })
      privateKey = '0xa2534f06a9bb510aee4e7e49cbfe0a431ced7aa184dace10a57d1754aeb4c874'
    }
    await browser.storage.local.set({ dapplets_lastUsage: new Date().toISOString() })
    this._wallet = new ethers.Wallet(privateKey, this.provider)
  }

  async disconnectWallet() {
    await browser.storage.local.remove('dapplets_lastUsage')
    await browser.storage.local.remove('dapplets_privateKey')
    this._wallet = null
  }

  async getMeta() {
    return {
      name: 'Built-in Wallet',
      description: 'Dapplets Browser Extension',
      icon: walletIcons['dapplets'],
    }
  }

  async getLastUsage() {
    return (await browser.storage.local.get('dapplets_lastUsage')).dapplets_lastUsage
  }

  private _initWallet = async () => {
    if (!this._wallet) {
      const privateKey: { [name: string]: string } = await browser.storage.local.get(
        'dapplets_privateKey'
      )
      if (Object.values(privateKey).length) {
        this._wallet = new ethers.Wallet(Object.values(privateKey)[0], this.provider) // ToDo: only the first key is used
      }
    }
  }
}
