import { TransactionRequest } from '@ethersproject/providers'
import { MetaMaskInpageProvider } from '@metamask/providers'
import { detect } from 'detect-browser'
import { ethers } from 'ethers'
import PortStream from 'extension-port-stream'
import browser from 'webextension-polyfill'
import { NotImplementedError } from '../../../common/errors'
import { CacheMethod } from '../../../common/helpers'
import * as walletIcons from '../../../common/resources/wallets'
import { EthereumWallet } from './interface'

export default class extends ethers.Signer implements EthereumWallet {
  public provider: ethers.providers.StaticJsonRpcProvider
  private _metamaskProviderPromise: Promise<MetaMaskInpageProvider> | null = null

  constructor(config: {
    providerUrl: string
    chainId: number
    ensAddress?: string
    name?: string
  }) {
    super()
    this.provider = new ethers.providers.StaticJsonRpcProvider(
      config.providerUrl,
      config.ensAddress && config.name
        ? { name: config.name, chainId: config.chainId, ensAddress: config.ensAddress }
        : config.chainId
    )
  }

  async getAddress(): Promise<string> {
    try {
      // ToDo: replace to ethereum.request({ method: 'eth_accounts' })
      const metamask = await this._getMetamaskProvider()
      return metamask.selectedAddress
    } catch (_) {
      return null
    }
  }

  async signMessage(message: string | ethers.Bytes): Promise<string> {
    const metamask = await this._getMetamaskProvider()
    const address = await this.getAddress()
    return (await metamask.request({
      method: 'personal_sign',
      params: [message, address.toLowerCase()],
    })) as string
  }

  async signTransaction(): Promise<string> {
    throw new NotImplementedError()
  }

  async sendTransaction(
    transaction: TransactionRequest
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

  async sendTransactionOutHash(transaction: TransactionRequest): Promise<string> {
    await this._prepareNetwork()
    const metamask = await this._getMetamaskProvider()
    await browser.storage.local.set({ metamask_lastUsage: new Date().toISOString() })
    transaction.from = await this.getAddress()
    const tx = await ethers.utils.resolveProperties(transaction)
    const txHash = (await metamask.request({
      method: 'eth_sendTransaction',
      params: [tx],
    })) as string
    return txHash
  }

  async sendCustomRequest(method: string, params: any[]): Promise<any> {
    await this._prepareNetwork()
    const metamask = await this._getMetamaskProvider()
    return metamask.request({ method, params })
  }

  connect(): ethers.Signer {
    throw new NotImplementedError()
  }

  async isAvailable() {
    try {
      await this._getMetamaskProvider()
      return true
    } catch (_) {
      return false
    }
  }

  async isConnected() {
    const disabled =
      (await browser.storage.local.get('metamask_disabled')).metamask_disabled === 'true'
    if (disabled) return false

    try {
      const metamask = await this._getMetamaskProvider()
      return metamask.isConnected() && !!metamask.selectedAddress
    } catch (_) {
      return false
    }
  }

  @CacheMethod()
  async connectWallet(): Promise<void> {
    const metamask = await this._getMetamaskProvider()
    if ((await browser.storage.local.get('metamask_disabled')).metamask_disabled === 'true') {
      await metamask.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })
      await browser.storage.local.remove('metamask_disabled')
    } else {
      await metamask.request({ method: 'eth_requestAccounts' })
    }
    await browser.storage.local.set({ metamask_disabled: new Date().toISOString() })
  }

  async disconnectWallet() {
    await browser.storage.local.set({ metamask_disabled: 'true' })
    browser.storage.local.remove('metamask_lastUsage')
  }

  async getMeta() {
    return {
      name: 'MetaMask',
      description: 'MetaMask Browser Extension',
      icon: walletIcons['metamask'],
    }
  }

  async getLastUsage() {
    return (await browser.storage.local.get('metamask_lastUsage')).metamask_lastUsage
  }

  private async _prepareNetwork(): Promise<void> {
    const network = await this.provider.getNetwork()
    const chainId = await this._getWalletChainId()

    if (network.chainId === chainId) return

    const metamask = await this._getMetamaskProvider()
    const chainIdHex = '0x' + network.chainId.toString(16)

    try {
      await metamask.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await metamask.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: network.name,
                rpcUrls: [this.provider.connection.url],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Network adding rejected')
        }
      }
      throw new Error('Network switching rejected')
    }
  }

  private async _getWalletChainId(): Promise<number> {
    const metamask = await this._getMetamaskProvider()
    const chainId = await metamask.request({
      method: 'eth_chainId',
      params: [],
    })
    return Number(chainId)
  }

  private async _getMetamaskProvider(): Promise<MetaMaskInpageProvider> {
    if (!this._metamaskProviderPromise) {
      this._metamaskProviderPromise = new Promise((res, rej) => {
        const currentMetaMaskId = this._getMetaMaskId()
        const metamaskPort = browser.runtime.connect(currentMetaMaskId)
        metamaskPort.onDisconnect.addListener(() => browser.runtime.lastError) // mute "Unchecked runtime.lastError"
        const pluginStream = new PortStream(metamaskPort)
        const metamask = new MetaMaskInpageProvider(pluginStream as any, {
          // mute all messages from provider
          logger: {
            warn: () => {},
            log: () => {},
            error: () => {},
            debug: () => {},
            info: () => {},
            trace: () => {},
          },
        })
        metamask['autoRefreshOnNetworkChange'] = false // silence the warning from metamask https://docs.metamask.io/guide/ethereum-provider.html#ethereum-autorefreshonnetworkchange
        metamask.on('connect', () => {
          // MV3 Extension doesn't have HTML-based background pages where favicon can be defined
          // We use the undocumented method metamask_sendDomainMetadata to manually provide metadata
          // https://github.com/MetaMask/providers/blob/6206aada4b1a8c14912fc9b0fcd0ec922d41251b/src/siteMetadata.ts#L23
          metamask.request({
            method: 'metamask_sendDomainMetadata',
            params: {
              name: 'Dapplets',
              icon: walletIcons['dapplets'],
            },
          })

          res(metamask)
        })
        metamask.on('disconnect', () => {
          this._metamaskProviderPromise = null
          rej('MetaMask is unavailable.')
        })
        // another available events: _initialized, chainChanged, networkChanged, accountsChanged, message, data, error
        // metamask.on('connect', (...args) => console.log('connect', args))
        // metamask.on('disconnect', (...args) => console.log('disconnect', args))
        // metamask.on('_initialized', (...args) => console.log('_initialized', args))
        // metamask.on('chainChanged', (...args) => console.log('chainChanged', args))
        // metamask.on('networkChanged', (...args) => console.log('networkChanged', args))
        // metamask.on('accountsChanged', (...args) => console.log('accountsChanged', args))
        // metamask.on('message', (...args) => console.log('message', args))
        // metamask.on('data', (...args) => console.log('data', args))
      })
    }

    return this._metamaskProviderPromise
  }

  private _getMetaMaskId() {
    const config = {
      CHROME_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
      FIREFOX_ID: 'webextension@metamask.io',
    }
    const browser = detect()
    switch (browser && browser.name) {
      case 'chrome':
        return config.CHROME_ID
      case 'firefox':
        return config.FIREFOX_ID
      default:
        return config.CHROME_ID
    }
  }
}
