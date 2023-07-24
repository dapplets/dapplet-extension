import * as ethers from 'ethers'
import * as NearApi from 'near-api-js'
import ModuleInfo from '../../background/models/moduleInfo'
import VersionInfo from '../../background/models/versionInfo'
import { generateGuid } from '../../common/generateGuid'
import { formatModuleId, joinUrls, parseShareLink } from '../../common/helpers'
import { NotificationPayload } from '../../common/models/notification'
import {
  LoginRequest,
  NearNetworks,
  SandboxEnvironmentVariables,
  TAlertAndConfirmPayload,
} from '../../common/types'
import { initBGFunctions, sendRequest } from '../communication'
import { IOverlayManager } from '../overlay/interfaces'
import { AppStorage } from './appStorage'
import ConnectedAccounts from './connectedAccounts'
import { Connection, EventDef } from './connection'
import * as ethereum from './ethereum'
import { IEtherneumWallet } from './ethereum/types'
import { EventBus } from './events/eventBus'
import { LoginSession } from './login/login-session'
import { LoginHooks, LoginRequestSettings } from './login/types'
import * as near from './near'
import { State } from './state'
import { WsJsonRpc } from './wsJsonRpc'

type Abi = any

type OverlayConnection<T> = Connection<T> & {
  id: string
  isOpen(): boolean
  close(): void
  onClose(callback: () => void): OverlayConnection<T>
  useState(state: State<T>): OverlayConnection<T>
}

interface WalletConnection {
  authMethod: 'ethereum/goerli' | 'ethereum/xdai' | 'near/testnet' | 'near/mainnet'
  isConnected(): Promise<boolean>
  connect(): Promise<void>
  disconnect(): Promise<void>
}

export interface IEthWallet extends IEtherneumWallet, WalletConnection {
  authMethod: 'ethereum/goerli' | 'ethereum/xdai'
}

export type INearWallet = NearApi.ConnectedWalletAccount &
  WalletConnection & {
    authMethod: 'near/testnet' | 'near/mainnet'
  }

export class Core {
  public utils = ethers.utils
  public BigNumber = ethers.BigNumber
  public ethers = ethers
  public near = NearApi
  public events: EventBus

  public manifest: VersionInfo
  public connectedAccounts: ConnectedAccounts
  public storage: AppStorage
  public overlayManager: IOverlayManager

  public connectedAccountsUpdateListener: () => void = null
  public walletsUpdateListener: () => void = null
  public shareLinkListener: (data: any) => void = null
  public actionListener: () => void = null
  public homeListener: () => void = null

  private _env: SandboxEnvironmentVariables
  private _loginSesssionsMap: Map<string, LoginSession> = new Map()

  constructor(
    manifest: VersionInfo,
    connectedAccounts: ConnectedAccounts,
    storage: AppStorage,
    overlayManager: IOverlayManager,
    env: SandboxEnvironmentVariables,
    moduleEventBus: EventBus
  ) {
    this.manifest = manifest
    this.connectedAccounts = connectedAccounts
    this.storage = storage
    this.overlayManager = overlayManager
    this._env = env
    this.events = moduleEventBus
  }

  async alertOrConfirm(message: string, type: 'alert' | 'confirm'): Promise<boolean> {
    const {
      getThisTab,
      getModuleInfoByName,
      showAlertOrConfirm,
    }: {
      getThisTab: () => Promise<{ id: number }>
      getModuleInfoByName: (url: string, name: string) => Promise<ModuleInfo>
      showAlertOrConfirm: (payload: TAlertAndConfirmPayload, tabId: number) => Promise<boolean>
    } = initBGFunctions()
    const moduleInfo = await getModuleInfoByName(this.manifest.registryUrl, this.manifest.name)
    const thisTab = await getThisTab()
    const id = generateGuid()
    return showAlertOrConfirm(
      { id, title: moduleInfo.title, message, icon: moduleInfo.icon, type },
      thisTab.id
    )
  }

  public async alert(message: string): Promise<void> {
    await this.alertOrConfirm(message, 'alert')
  }

  public async confirm(message: string): Promise<boolean> {
    return this.alertOrConfirm(message, 'confirm')
  }

  public async notify(payloadOrMessage: NotificationPayload | string) {
    const { createAndShowNotification, getThisTab, getModuleInfoByName } = initBGFunctions()

    // ToDo: move to background
    const moduleInfo: ModuleInfo = await getModuleInfoByName(
      this.manifest.registryUrl,
      this.manifest.name
    )

    const payload: NotificationPayload =
      typeof payloadOrMessage === 'string'
        ? { title: moduleInfo.title, message: payloadOrMessage }
        : payloadOrMessage

    const thisTab = await getThisTab()

    const notification = {
      ...payload,
      icon: moduleInfo.icon,
      source: this.manifest.name,
    }

    await createAndShowNotification(notification, thisTab.id)
  }

  public async openPage(url: string): Promise<void> {
    return sendRequest('openPage', url)
  }

  public onConnectedAccountsUpdate(listener: () => void) {
    this.connectedAccountsUpdateListener = listener
  }

  public onWalletsUpdate(listener: () => void) {
    this.walletsUpdateListener = listener
  }

  public onAction(listener: () => void) {
    this.actionListener = listener
  }

  public onHome(listener: () => void) {
    this.homeListener = listener
  }

  public onShareLink(listener: (data: any) => void) {
    this.shareLinkListener = listener
  }

  public async getPreferredConnectedAccountsNetwork(): Promise<NearNetworks> {
    const { getPreferredConnectedAccountsNetwork } = initBGFunctions()
    return getPreferredConnectedAccountsNetwork()
  }

  public overlay<T>(
    cfg: { name: string; url?: string; title: string; source?: string; module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<any>
  public overlay<T>(
    cfg: { name: string; url?: string; title: string; source?: string; module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T>
  public overlay<T>(
    cfg: { name?: string; url: string; title: string; source?: string; module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T>
  public overlay<T>(
    cfg: { name: string; url: string; title: string; source?: string; module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T | any> {
    cfg.source = this.manifest.name
    cfg.module = { name: this.manifest.name, registryUrl: this.manifest.registryUrl }

    if (cfg.name) {
      const overlay = this.manifest.overlays?.[cfg.name]
      if (!overlay) throw new Error(`Cannot find overlay with name "${cfg.name}" in the manifest.`)

      if (
        (this._env.preferedOverlayStorage === 'centralized' && overlay.hash) ||
        overlay.uris.length === 0
      ) {
        cfg.url = joinUrls(
          'https://dapplet-api.s3-website.nl-ams.scw.cloud/',
          overlay.hash.replace('0x', '')
        )
      } else {
        // ToDo: support multiple uris
        const url = new URL(overlay.uris[0])

        if (url.protocol === 'bzz:') {
          cfg.url = joinUrls(this._env.swarmGatewayUrl, `bzz/${url.pathname.slice(2)}`)
        } else if (url.protocol === 'http:' || url.protocol === 'https:') {
          cfg.url = url.href
        } else if (this._env.preferedOverlayStorage === 'decentralized' && overlay.hash) {
          cfg.url = joinUrls(
            'https://dapplet-api.s3-website.nl-ams.scw.cloud/',
            overlay.hash.replace('0x', '')
          )
        } else {
          throw new Error(`Invalid protocol "${url.protocol}" in the overlay address.`)
        }
      }
    }

    const _overlay = this.overlayManager.createOverlay({
      url: cfg.url,
      title: cfg.title,
      source: cfg.source,
      module: cfg.module,
    })
    const conn = new Connection<T>(_overlay, eventDef)
    let overridedConn: OverlayConnection<T> // ToDo: looks like a bug
    const overrides = {
      id: _overlay.id,
      isOpen() {
        return _overlay.registered
      },
      close() {
        _overlay.close()
      },
      onClose(callback: () => void) {
        _overlay.onclose = () => callback()
        return overridedConn
      },
      useState(state: State<T>) {
        conn.state = state
        conn.state.addConnection(conn)
        return overridedConn
      },
    }
    overridedConn = Object.assign(conn, overrides)
    return overridedConn
  }

  public async wallet(cfg: {
    authMethods: ('ethereum/goerli' | 'ethereum/xdai')[]
  }): Promise<IEthWallet>
  public async wallet(cfg: {
    authMethods: ('near/testnet' | 'near/mainnet')[]
  }): Promise<INearWallet>
  public async wallet(cfg: {
    authMethods: ('ethereum/goerli' | 'ethereum/xdai' | 'near/testnet' | 'near/mainnet')[]
  }): Promise<IEthWallet | INearWallet>
  public async wallet(
    cfg: {
      type: 'ethereum'
      network: 'xdai'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ): Promise<WalletConnection & IEtherneumWallet>
  public async wallet(
    cfg: {
      type: 'ethereum'
      network: 'goerli'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ): Promise<WalletConnection & IEtherneumWallet>
  public async wallet(
    cfg: {
      type: 'near'
      network: 'testnet'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ): Promise<WalletConnection & NearApi.ConnectedWalletAccount>
  public async wallet(
    cfg: {
      type: 'near'
      network: 'mainnet'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ): Promise<WalletConnection & NearApi.ConnectedWalletAccount>
  public async wallet(
    cfg: {
      authMethods?: ('ethereum/goerli' | 'ethereum/xdai' | 'near/testnet' | 'near/mainnet')[]
      type?: 'ethereum' | 'near'
      network?: 'goerli' | 'xdai' | 'testnet' | 'mainnet'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ) {
    if (!cfg || !(cfg.authMethods || (cfg.type && cfg.network)))
      throw new Error(' "authMethods" or "type" with "network" are required in Core.wallet().')
    if (cfg.authMethods) {
      cfg.authMethods.forEach((x) => {
        if (!['ethereum/goerli', 'ethereum/xdai', 'near/testnet', 'near/mainnet'].includes(x))
          throw new Error(
            'The "ethereum/goerli", "ethereum/xdai", "near/testnet" and "near/mainnet" only are supported in Core.wallet().'
          )
      })
    } else {
      if (cfg.type !== 'near' && cfg.type !== 'ethereum')
        throw new Error('The "ethereum" and "near" only are supported in Core.wallet().')
      if (cfg.type === 'near' && !(cfg.network == 'testnet' || cfg.network == 'mainnet'))
        throw new Error('"testnet" and "mainnet" network only is supported in "near" type wallet.')
      if (cfg.type === 'ethereum' && !(cfg.network == 'goerli' || cfg.network == 'xdai'))
        throw new Error(
          '"goerli" and "xdai" networks only are supported in "ethereum" type wallet.'
        )
    }

    const _authMethods = cfg.authMethods ?? [cfg.type + '/' + cfg.network]

    const isConnected = async () => {
      const { getWalletDescriptors } = initBGFunctions()
      const sessions = await this.sessions()
      const session = sessions.find((x) => _authMethods.includes(x.authMethod))
      if (!session) return false

      // ToDo: remove it when subscription on disconnect event will be implemented
      //       (see: /background/services/walletService.ts/disconnect())
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find((x) => x.chain == session.authMethod)
      return descriptor ? descriptor.connected : false
    }

    const getSessionObject = async () => {
      const connected = await isConnected()
      if (!connected) return null

      const sessions = await this.sessions()
      const session = sessions.find((x) => _authMethods.includes(x.authMethod))

      if (!session) {
        return null
      } else {
        return session
      }
    }

    const session = await getSessionObject()
    const authMethod = session?.authMethod
    const wallet = !session
      ? null
      : authMethod === 'ethereum/goerli' || authMethod === 'ethereum/xdai'
      ? <IEthWallet>await session.wallet()
      : <INearWallet>await session.wallet()

    const me = this

    const proxied = {
      _wallet: wallet,
      _session: session,
      authMethod,

      async isConnected(): Promise<boolean> {
        return isConnected()
      },

      async connect(): Promise<void> {
        if (this._session && this._wallet) return // ???
        this._session = await me.login({ authMethods: _authMethods, secureLogin: 'disabled' }, {})
        this.authMethod = this._session.authMethod
        this._wallet =
          this.authMethod === 'ethereum/goerli' || this.authMethod === 'ethereum/xdai'
            ? <IEthWallet>await this._session.wallet()
            : <INearWallet>await this._session.wallet()
      },

      async disconnect(): Promise<void> {
        return this._session.logout()
      },
    }

    return new Proxy(proxied, {
      get(target, prop) {
        if (prop in target) {
          return target[prop]
        } else if (target._wallet !== null) {
          return target._wallet[prop]
        }
      },
    }) as any
  }

  public async contract(
    type: 'ethereum' | 'ethereum/xdai',
    address: string,
    options: Abi
  ): Promise<any>
  public async contract(
    type: 'near',
    address: string,
    options: {
      viewMethods: string[]
      changeMethods: string[]
      network?: 'mainnet' | 'testnet'
    }
  ): Promise<any>
  public async contract(
    type: 'near' | 'ethereum' | 'ethereum/xdai',
    address: string,
    options: any
  ): Promise<any> {
    const moduleName = this.manifest.name
    if (type === 'ethereum') {
      return ethereum.createContractWrapper(moduleName, { network: 'goerli' }, address, options)
    } else if (type === 'ethereum/xdai') {
      return ethereum.createContractWrapper(moduleName, { network: 'xdai' }, address, options)
    } else if (type === 'near') {
      const network = options.network ?? 'testnet'
      return near.createContractWrapper(moduleName, { network }, address, options)
    } else {
      throw new Error('"ethereum", "ethereum/xdai" and "near" contracts only are supported.')
    }
  }

  public async sessions(): Promise<LoginSession[]> {
    const { getSessions } = initBGFunctions()
    const sessions = await getSessions(this.manifest.name)
    return sessions.map((session) => {
      if (!this._loginSesssionsMap.has(session.id)) {
        this._loginSesssionsMap.set(session.id, new LoginSession(session))
      }

      return this._loginSesssionsMap.get(session.id)
    })
  }

  public async login(
    request: LoginRequest & LoginHooks,
    settings?: LoginRequestSettings & LoginHooks
  ): Promise<LoginSession>
  public async login(
    request: (LoginRequest & LoginHooks)[],
    settings?: LoginRequestSettings & LoginHooks
  ): Promise<LoginSession[]>
  public async login(
    request: (LoginRequest & LoginHooks) | (LoginRequest & LoginHooks)[],
    settings?: LoginRequestSettings & LoginHooks
  ): Promise<LoginSession | LoginSession[]> {
    const moduleName = this.manifest.name

    if (Array.isArray(request)) {
      return Promise.all(request.map((x) => this.login(x, settings)))
    }

    const _request = { ...request }

    if (settings) {
      Object.assign(_request, settings)
    }

    // ToDo: implement target
    // if (!_request.target) {
    //   const overlays = this.overlayManager.getOverlays().filter((x) => x.source === moduleName)
    //   const target = overlays.length > 0 ? overlays[0].id : null
    //   _request.target = target
    // }

    if (_request.target && typeof _request.target === 'object') {
      _request.target = _request.target.id
    }

    const { onLogin, onLogout } = _request

    // Remove unserializable hooks from the request
    delete _request.onLogin
    delete _request.onLogout

    const { createSession, getThisTab } = initBGFunctions()
    const thisTab = await getThisTab()
    const session = await createSession(moduleName, _request, thisTab.id)

    const ls = {} // ToDo: specify LoginInfo
    onLogin?.call({}, ls)

    const loginSession = new LoginSession(session)
    loginSession.logoutHandler = onLogout
    this._loginSesssionsMap.set(session.id, loginSession)

    return loginSession
  }

  public state<T>(defaultState: T, type?: string) {
    return new State<T>(defaultState, type)
  }

  public createShareLink(targetUrl: string, modulePayload: any): string {
    const groups = /https:\/\/augm\.link\/live\/(.*)/gm.exec(targetUrl)
    const [, targetUrlNoProxy] = groups ?? []
    if (targetUrlNoProxy) targetUrl = targetUrlNoProxy
    const { urlNoPayload } = parseShareLink(targetUrl) // prevent duplicate of base64 payload
    const payload = [
      EXTENSION_VERSION,
      this.manifest.registryUrl,
      formatModuleId(this.manifest),
      ['*'], // ToDo: Replace wildcard on real context IDs
      modulePayload,
    ]
    const base64Payload = btoa(JSON.stringify(payload))
    const WEB_PROXY_URL = 'https://augm.link/live/'
    return WEB_PROXY_URL + urlNoPayload + '#dapplet/' + base64Payload
  }

  public async getManifest(
    moduleName?: string
  ): Promise<Omit<ModuleInfo, 'interfaces'> & VersionInfo> {
    if (moduleName !== this.manifest.name) {
      throw new Error('The requested module name does not match the current module.')
    }

    const { getModuleInfoByName } = initBGFunctions()
    const registry = this.manifest.registryUrl
    const moduleInfo: ModuleInfo = await getModuleInfoByName(registry, moduleName)
    return { ...moduleInfo, ...this.manifest }
  }

  public connect<T>(cfg: { url: string }, defaultState: T): Connection<T> {
    const rpc = new WsJsonRpc(cfg.url)
    const conn = new Connection<T>(rpc)
    const state = this.state(defaultState, 'server')
    conn.state = state
    conn.state.addConnection(conn)
    return conn
  }
}
