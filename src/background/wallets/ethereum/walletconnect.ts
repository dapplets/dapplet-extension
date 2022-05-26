import { Provider, TransactionRequest } from '@ethersproject/providers'
import WalletConnect from '@walletconnect/client'
import { ethers } from 'ethers'
import { Deferrable } from 'ethers/lib/utils'
import { EthereumWallet } from './interface'

export default class extends ethers.Signer implements EthereumWallet {
  public provider: ethers.providers.JsonRpcProvider
  private _sendDataToPairingOverlay: (topic: string, args: any[]) => void
  private __walletconnect?: WalletConnect

  private get _walletconnect(): WalletConnect {
    if (!this.__walletconnect) {
      this.__walletconnect = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
      })
    }

    return this.__walletconnect
  }

  private set _walletconnect(v: any) {
    this.__walletconnect = v
  }

  constructor(config: {
    providerUrl: string
    sendDataToPairingOverlay: (topic: string, args: any[]) => void
  }) {
    super()
    this.provider = new ethers.providers.JsonRpcProvider(config.providerUrl)
    this._sendDataToPairingOverlay = config.sendDataToPairingOverlay
  }

  async getAddress(): Promise<string> {
    return Promise.resolve(
      this._walletconnect?.accounts[0] || '0x0000000000000000000000000000000000000000'
    )
  }

  async signMessage(message: string | ethers.Bytes): Promise<string> {
    const address = await this.getAddress()
    return this._walletconnect.sendCustomRequest({
      method: 'personal_sign',
      params: [message, address.toLowerCase()],
    })
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    throw new Error('Not implemented')
  }

  async sendTransaction(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    const txHash = await this.sendTransactionOutHash(transaction)

    // the wait of a transaction from another provider can be long
    let tx = null
    while (tx === null) {
      await new Promise((res) => setTimeout(res, 1000))
      tx = await this.provider.getTransaction(txHash)
    }

    return tx
  }

  async sendTransactionOutHash(transaction: ethers.providers.TransactionRequest): Promise<string> {
    transaction.from = await this.getAddress()
    const tx = await ethers.utils.resolveProperties(transaction)
    const txHash = await this._walletconnect.sendTransaction(tx as any)
    localStorage['walletconnect_lastUsage'] = new Date().toISOString()
    return txHash
  }

  async sendCustomRequest(method: string, params: any[]): Promise<any> {
    return this._walletconnect.sendCustomRequest({ method, params })
  }

  connect(provider: Provider): ethers.Signer {
    throw new Error('Method not implemented.')
  }

  async isAvailable() {
    return true
  }

  async isConnected() {
    return this._walletconnect?.connected ?? false
  }

  async connectWallet({ overlayId }: { overlayId: string }): Promise<void> {
    if (this._walletconnect.connected) return
    this._walletconnect['_handshakeTopic'] = '' // ToDo: remove after update of WalletConnect to >1.3.1

    const callback = (err, payload) => {
      this._walletconnect.off('display_uri')
      if (err) throw err
      const [uri] = payload.params
      this._showQR(uri, overlayId)
    }

    this._walletconnect.on('display_uri', callback)
    await this._walletconnect.createSession()

    return new Promise((resolve, reject) => {
      this._walletconnect.on('connect', (error, payload) => {
        if (error) {
          reject(error)
        } else {
          localStorage['walletconnect_lastUsage'] = new Date().toISOString()
          resolve(payload)
        }
      })
    })
  }

  async disconnectWallet() {
    if (this._walletconnect?.connected) {
      await this._walletconnect.killSession()
      delete localStorage['walletconnect']
      delete localStorage['walletconnect_lastUsage']
      this._walletconnect = null
    }
  }

  async getMeta() {
    const m = this._walletconnect?.peerMeta
    return m
      ? {
          name: m.name,
          description: m.description,
          icon: m.icons[0],
        }
      : null
  }

  getLastUsage() {
    return localStorage['walletconnect_lastUsage']
  }

  private async _showQR(uri: string, overlayId?: string) {
    this._sendDataToPairingOverlay('walletconnect', [uri, overlayId])
  }
}
