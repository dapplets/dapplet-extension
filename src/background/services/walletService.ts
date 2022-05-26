import { providers, Signer, utils } from 'ethers'
import * as EventBus from '../../common/global-event-bus'
import {
  ChainTypes,
  DefaultSigners,
  LoginRequest,
  WalletDescriptor,
  WalletTypes,
} from '../../common/types'
import wallets from '../wallets'
import { EthereumWallet } from '../wallets/ethereum/interface'
import { GenericWallet } from '../wallets/interface'
import { NearWallet } from '../wallets/near/interface'
import GlobalConfigService from './globalConfigService'
import { OverlayService } from './overlayService'
import { SessionService } from './sessionService'

export class WalletService {
  public sessionService: SessionService

  private _map: Promise<{ [chain: string]: { [wallet: string]: GenericWallet } }>
  private _signersByApp = new Map<string, Signer>()

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _overlayService: OverlayService
  ) {}

  async connectWallet(chain: ChainTypes, wallet: WalletTypes, params?: any) {
    if (!params) params = {}
    // ToDo: is need chain argument?
    // const chain = (await this._getWalletsArray()).find(x => x.wallet === wallet).chain;
    const map = await this._getWalletsMap()
    await map[chain][wallet].connectWallet(params)
    EventBus.emit('wallet_changed')
  }

  async disconnectWallet(chain: ChainTypes, wallet: WalletTypes) {
    // ToDo: is need chain argument?
    // const chain = (await this._getWalletsArray()).find(x => x.wallet === wallet).chain;
    const map = await this._getWalletsMap()
    await map[chain][wallet].disconnectWallet()

    const usage = await this._globalConfigService.getWalletsUsage()

    for (const app in usage) {
      if (usage?.[app]?.[chain] === wallet) {
        delete usage[app][chain]
      }
    }

    await this._globalConfigService.setWalletsUsage(usage)
    this.sessionService.killSessionsByWallet(wallet)
    // ToDo: subscribe on disconnect event from wallet to kill sessions.
    EventBus.emit('wallet_changed')
  }

  async getWalletDescriptors(): Promise<WalletDescriptor[]> {
    const defaults = await this._getWalletFor(DefaultSigners.EXTENSION)
    const usage = await this._globalConfigService.getWalletsUsage()
    const arr = await this._getWalletsArray()

    const getUsageApps = (chain: ChainTypes, wallet: WalletTypes) => {
      const arr: string[] = []
      for (const app in usage) {
        if (usage[app]?.[chain] === wallet) {
          arr.push(app)
        }
      }
      return arr
    }

    return Promise.all(
      arr.map(async (w) => ({
        chain: w.chain,
        type: w.wallet,
        meta: await w.instance.getMeta(),
        connected: await w.instance.isConnected(),
        available: await w.instance.isAvailable(),
        account: await w.instance.getAddress(),
        chainId: await w.instance.getChainId(),
        apps: getUsageApps(w.chain, w.wallet),
        default: w.wallet === defaults[w.chain],
        lastUsage: w.instance.getLastUsage(),
      }))
    )
  }

  async eth_getSignerFor(app: string | DefaultSigners): Promise<Signer> {
    if (!this._signersByApp.has(app)) {
      const me = this
      const providerUrl = await this._globalConfigService.getEthereumProvider()
      const signer = new (class extends Signer {
        provider = new providers.JsonRpcProvider(providerUrl)

        constructor() {
          super()
        }

        async getAddress(): Promise<string> {
          const signer = (await me._getInternalSignerFor(
            app,
            ChainTypes.ETHEREUM_GOERLI
          )) as EthereumWallet
          if (!signer) return '0x0000000000000000000000000000000000000000'
          const address = await signer.getAddress()
          if (!address) return '0x0000000000000000000000000000000000000000'
          return address
        }

        async signMessage(message: string | utils.Bytes): Promise<string> {
          throw new Error('Method not implemented.')
        }

        async signTransaction(
          transaction: utils.Deferrable<providers.TransactionRequest>
        ): Promise<string> {
          throw new Error('Method not implemented.')
        }

        async sendTransaction(
          transaction: providers.TransactionRequest
        ): Promise<providers.TransactionResponse> {
          const signer =
            ((await me._getInternalSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet) ??
            ((await me._pairSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet)
          return signer.sendTransaction(transaction)
        }

        connect(provider: providers.Provider): Signer {
          throw new Error('Method not implemented.')
        }
      })()

      this._signersByApp.set(app, signer)
    }

    return this._signersByApp.get(app)
  }

  public async setWalletFor(
    walletType: WalletTypes,
    app: string | DefaultSigners,
    chain: ChainTypes
  ) {
    const wallets = await this._globalConfigService.getWalletsUsage()
    if (!wallets[app]) wallets[app] = {}
    wallets[app][chain] = walletType
    await this._globalConfigService.setWalletsUsage(wallets)
  }

  public async unsetWalletFor(app: string | DefaultSigners, chain: ChainTypes) {
    const wallets = await this._globalConfigService.getWalletsUsage()
    if (!wallets[app]) return
    delete wallets[app][chain]
    await this._globalConfigService.setWalletsUsage(wallets)
  }

  public async prepareWalletFor(
    app: string | DefaultSigners,
    chain: ChainTypes,
    cfg: { username: string; domainId: number; fullname?: string; img?: string },
    request: LoginRequest,
    tabId: number
  ) {
    const isLoginSession = /[a-f0-9]{32}/gm.test(app)

    if (isLoginSession) {
      const session = await this.sessionService.getSession(app)
      if (!session) throw new Error("The session doesn't exist.")
      if (session.isExpired()) throw new Error('The session is expired.')

      const map = await this._getWalletsMap()
      const wallet = map[session.authMethod][session.walletType]
      if (!(await wallet.isAvailable())) throw new Error('The wallet is not available')
      if (!(await wallet.isConnected())) await wallet.connectWallet({})

      return
    }

    const defaults = await this._getWalletFor(app)
    const defaultWallet = defaults[chain]

    const payload = {
      app,
      loginRequest: request || { authMethods: [chain], secureLogin: 'disabled' },
    }

    if (!defaultWallet) {
      // is login required?
      if (cfg && cfg.username && cfg.domainId) {
        return this._overlayService.loginViaOverlay(payload, tabId)
      } else {
        return this._overlayService.selectWalletViaOverlay(payload, tabId)
      }
    }

    const pairedWallets = await this.getWalletDescriptors()
    const suitableWallet = pairedWallets.find((x) => x.chain === chain && x.type === defaultWallet)

    if (!suitableWallet || !suitableWallet.connected) {
      // is login required?
      if (cfg && cfg.username && cfg.domainId) {
        return this._overlayService.loginViaOverlay(payload, tabId)
      } else {
        return this._overlayService.selectWalletViaOverlay(payload, tabId)
      }
    }
  }

  public async getAddress(app: string | DefaultSigners, chain: ChainTypes): Promise<string> {
    const wallet = await this._getInternalSignerFor(app, chain)
    return wallet?.getAddress() ?? '0x0000000000000000000000000000000000000000'
  }

  public async eth_sendTransactionOutHash(
    app: string | DefaultSigners,
    transaction: providers.TransactionRequest
  ): Promise<string> {
    const wallet =
      ((await this._getInternalSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet) ??
      ((await this._pairSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet)
    if (!(await wallet.isAvailable())) throw new Error('The wallet is not available')
    if (!(await wallet.isConnected())) await wallet.connectWallet({})
    return wallet.sendTransactionOutHash(transaction)
  }

  public async eth_sendCustomRequest(
    app: string | DefaultSigners,
    method: string,
    params: any[]
  ): Promise<any> {
    const wallet =
      ((await this._getInternalSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet) ??
      ((await this._pairSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet)
    if (!(await wallet.isAvailable())) throw new Error('The wallet is not available')
    if (!(await wallet.isConnected())) await wallet.connectWallet({})
    return wallet.sendCustomRequest(method, params)
  }

  public async eth_waitTransaction(
    app: string | DefaultSigners,
    txHash: string,
    confirmations?: number
  ) {
    const wallet =
      ((await this._getInternalSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet) ??
      ((await this._pairSignerFor(app, ChainTypes.ETHEREUM_GOERLI)) as EthereumWallet)
    // the wait of a transaction from another provider can be long
    while (true) {
      await new Promise((res) => setTimeout(res, 1000))
      const tx = await wallet.provider.getTransaction(txHash)
      if (tx) return tx.wait(confirmations)
    }
  }

  public async near_sendCustomRequest(
    app: string | DefaultSigners,
    network: string,
    method: string,
    params: any[]
  ): Promise<any> {
    const type =
      network === 'testnet'
        ? ChainTypes.NEAR_TESTNET
        : network === 'mainnet'
        ? ChainTypes.NEAR_MAINNET
        : null
    if (type === null) throw new Error('Unsupported network for NEAR Protocol blockchain.')
    const wallet = (await this._getInternalSignerFor(app, type, false)) as NearWallet
    return wallet.sendCustomRequest(method, params)
  }

  public async near_getAccount(app: string | DefaultSigners) {
    const wallet = (await this._getInternalSignerFor(
      app,
      ChainTypes.NEAR_TESTNET,
      false
    )) as NearWallet
    return wallet.getAccount()
  }

  public async getGenericWallet(chain: ChainTypes, wallet: WalletTypes): Promise<GenericWallet> {
    const map = await this._getWalletsMap()
    return map[chain][wallet]
  }

  private async _getInternalSignerFor(
    appOrSessionId: string | DefaultSigners,
    chain: ChainTypes,
    isConnected = true
  ): Promise<GenericWallet> {
    const map = await this._getWalletsMap()

    const isLoginSession = /[a-f0-9]{32}/gm.test(appOrSessionId)

    if (!isLoginSession) {
      const defaults = await this._getWalletFor(appOrSessionId)
      const defaultWallet = defaults?.[chain]

      if (defaultWallet && (await map[chain][defaultWallet].isConnected())) {
        return map[chain][defaultWallet]
      }

      // ToDo: clean walletType?

      // choose first connected wallet
      for (const wallet in map[chain]) {
        if (await map[chain][wallet].isConnected()) {
          return map[chain][wallet]
        }
      }

      if (!isConnected) {
        for (const wallet in map[chain]) {
          return map[chain][wallet]
        }
      }
    } else {
      const session = await this.sessionService.getSession(appOrSessionId)
      if (!session) throw new Error("The session doesn't exist.")
      if (session.isExpired()) throw new Error('The session is expired.')

      const wallet = map[session.authMethod][session.walletType]
      return wallet
    }
  }

  private async _pairSignerFor(
    app: string | DefaultSigners,
    chain: ChainTypes
  ): Promise<GenericWallet> {
    // pairing
    await this._overlayService.pairWalletViaOverlay(chain, app, null) // ToDo: set tabId

    const map = await this._getWalletsMap()

    // choose first connected wallet
    for (const wallet in map[chain]) {
      if (await map[chain][wallet].isConnected()) {
        return map[chain][wallet]
      }
    }

    throw new Error('Cannot find signer')
  }

  private async _getWalletsArray() {
    const map = await this._getWalletsMap()
    const arr: { chain: ChainTypes; wallet: WalletTypes; instance: GenericWallet }[] = []
    for (const chain in map) {
      for (const wallet in map[chain]) {
        arr.push({
          chain: chain as ChainTypes,
          wallet: wallet as WalletTypes,
          instance: map[chain][wallet],
        })
      }
    }
    return arr
  }

  // returns: walletType
  private async _getWalletFor(app: string | DefaultSigners): Promise<{ [chain: string]: string }> {
    const wallets = await this._globalConfigService.getWalletsUsage()
    return wallets[app] ?? {}
  }

  private async _getWalletsMap() {
    if (!this._map) {
      this._map = this._globalConfigService.getEthereumProvider().then((providerUrl) => {
        const map = {}
        const config = {
          providerUrl,
          sendDataToPairingOverlay: this._overlayService.sendDataToPairingOverlay.bind(
            this._overlayService
          ),
        }

        for (const chain in wallets) {
          map[chain] = {}
          for (const wallet in wallets[chain]) {
            map[chain][wallet] = new wallets[chain][wallet](config)
          }
        }

        return map
      })
    }

    return this._map
  }
}
