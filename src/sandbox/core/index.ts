import * as ethers from 'ethers'
import * as NearApi from 'near-api-js'
import VersionInfo from '../../background/models/versionInfo'
import { joinUrls } from '../../common/helpers'
import { LoginRequest, SandboxEnvironmentVariables } from '../../common/types'
import { initBGFunctions, sendRequest } from '../communication'
import { IOverlayManager } from '../overlay/interfaces'
import { AppStorage } from './appStorage'
import ConnectedAccounts from './connectedAccounts'
import { Connection, EventDef } from './connection'
import * as ethereum from './ethereum'
import { LoginSession } from './login/login-session'
import { LoginHooks, LoginRequestSettings } from './login/types'
import * as near from './near'
import { State } from './state'

type Abi = any

type OverlayConnection<T> = Connection<T> & {
  id: string
  isOpen(): boolean
  close(): void
  onClose(callback: () => void): OverlayConnection<T>
  useState(state: State<T>): OverlayConnection<T>
}

export class Core {
  public utils = ethers.utils
  public BigNumber = ethers.BigNumber
  public ethers = ethers
  public near = NearApi

  public manifest: VersionInfo
  public connectedAccounts: ConnectedAccounts
  public storage: AppStorage
  public overlayManager: IOverlayManager

  public connectedAccountsUpdateListener: () => void = null
  public walletsUpdateListener: () => void = null
  public actionListener: () => void = null
  public homeListener: () => void = null

  private _env: SandboxEnvironmentVariables

  constructor(
    manifest: VersionInfo,
    connectedAccounts: ConnectedAccounts,
    storage: AppStorage,
    overlayManager: IOverlayManager,
    env: SandboxEnvironmentVariables
  ) {
    this.manifest = manifest
    this.connectedAccounts = connectedAccounts
    this.storage = storage
    this.overlayManager = overlayManager
    this._env = env
  }

  public async confirm(message: string): Promise<boolean> {
    return sendRequest('confirm', message)
  }

  public async alert(message: string): Promise<void> {
    return sendRequest('alert', message)
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

  async getPreferredConnectedAccountsNetwork(): Promise<string> {
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

      const url = new URL(overlay.uris[0])

      if (this._env.preferedOverlayStorage === 'centralized' && overlay.hash) {
        cfg.url = joinUrls(
          'https://dapplet-api.s3-website.nl-ams.scw.cloud/',
          overlay.hash.replace('0x', '')
        )
      } else if (url.protocol === 'bzz:') {
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

    const _overlay = this.overlayManager.createOverlay({
      url: cfg.url,
      title: cfg.title,
      source: cfg.source,
      module: cfg.module,
    })
    const conn = new Connection<T>(_overlay, eventDef)
    let overridedConn: OverlayConnection<T>
    const overrides = {
      id: _overlay.id,
      isOpen() {
        return _overlay.registered
      },
      close() {
        _overlay.close()
      },
      onClose(callback: () => void) {
        _overlay.frame.addEventListener('onOverlayClose', () => callback())
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
    return sessions.map((x) => new LoginSession(x))
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

    const { createSession, getThisTab } = initBGFunctions()
    const thisTab = await getThisTab()
    const session = await createSession(moduleName, _request, thisTab.id)

    const ls = {} // ToDo: specify LoginInfo
    _request.onLogin?.call({}, ls)

    const loginSession = new LoginSession(session)
    loginSession.logoutHandler = _request.onLogout

    return loginSession
  }

  public state<T>(defaultState: T, type?: string) {
    return new State<T>(defaultState, type)
  }
}
