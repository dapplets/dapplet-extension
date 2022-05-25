import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'

import * as ethers from 'ethers'
import * as NearApi from 'near-api-js'

import { IOverlay, IOverlayManager } from './overlay/interfaces'
import { Swiper } from './swiper'
import { EventDef, Connection } from './connection'
import { WsJsonRpc } from './wsJsonRpc'
import { AppStorage } from './appStorage'
import { SystemOverlayTabs, LoginRequest } from '../common/types'
import { generateGuid, parseShareLink } from '../common/helpers'
import * as near from './near'
import * as ethereum from './ethereum'
import { LoginSession } from './login/login-session'
import { LoginHooks, LoginRequestSettings } from './login/types'
import { IEtherneumWallet } from './ethereum/types'
import ModuleInfo from '../background/models/moduleInfo'
import VersionInfo from '../background/models/versionInfo'
import { State } from './state'

type Abi = any

type OverlayConnection<T> = Connection<T> & {
  id: string
  isOpen(): boolean
  close(): void
  onClose(callback: () => void): OverlayConnection<T>
  useState(state: State<T>): OverlayConnection<T>
}

interface WalletConnection {
  authMethod: 'ethereum/goerli' | 'near/testnet' | 'near/mainnet'
  isConnected(): Promise<boolean>
  connect(): Promise<void>
  disconnect(): Promise<void>
}

export interface IEthWallet extends IEtherneumWallet, WalletConnection {
  authMethod: 'ethereum/goerli'
}

export type INearWallet = NearApi.ConnectedWalletAccount &
  WalletConnection & {
    authMethod: 'near/testnet' | 'near/mainnet'
  }

type ContentDetector = {
  contextId: string
  selector: string
}

export default class Core {
  private _popupOverlay: IOverlay = null

  constructor(isIframe: boolean, public overlayManager: IOverlayManager) {
    if (!isIframe) {
      browser.runtime.onMessage.addListener((message, sender) => {
        if (typeof message === 'string') {
          if (message === 'TOGGLE_OVERLAY') {
            this.toggleOverlay()
          } else if (message === 'OPEN_OVERLAY') {
            // used by pure jslib
            this.openOverlay()
          } else if (message === 'CLOSE_OVERLAY') {
            // used by pure jslib
            this.closeOverlay()
          }
        } else if (typeof message === 'object' && message.type !== undefined) {
          if (message.type === 'OPEN_DEPLOY_OVERLAY') {
            return this.waitDeployOverlay(message.payload)
          } else if (message.type === 'APPROVE_SOWA_TRANSACTION') {
            return this._approveSowaTransaction(
              message.payload.sowaId,
              message.payload.metadata
            )
              .then(() => [null, 'approved'])
              .catch(() => ['error'])
          } else if (message.type === 'OPEN_SETTINGS_OVERLAY') {
            return this.waitSettingsOverlay(message.payload)
          } else if (message.type === 'OPEN_GUIDE_OVERLAY') {
            return this.waitGuideOverlay(message.payload)
          } else if (message.type === 'OPEN_PAIRING_OVERLAY') {
            if (
              message.payload.topic === 'walletconnect' &&
              message.payload.args[1]
            ) {
              const [, overlayId] = message.payload.args
              const targetOverlay = this.overlayManager
                .getOverlays()
                .find((x) => x.id === overlayId)
              targetOverlay?.send(message.payload.topic, message.payload.args)
              return Promise.resolve([null, 'ready'])
            } else {
              return this.waitPairingOverlay(
                message.payload.topic,
                message.payload.args
              )
                .then(() => [null, 'ready'])
                .catch(() => ['error'])
            }
          } else if (message.type === 'OPEN_LOGIN_OVERLAY') {
            return this.waitLoginOverlay(
              message.payload.topic,
              message.payload.args
            )
              .then(() => [null, 'ready'])
              .catch((err) => [err])
          } else if (message.type === 'OPEN_POPUP_OVERLAY') {
            return Promise.resolve(
              this.overlayManager.openPopup(message.payload.path)
            ) // ToDo: make toggle of the overlay
          } else if (message.type === 'OPEN_SYSTEM_OVERLAY') {
            return this.waitSystemOverlay(message.payload)
              .then((x) => [null, x])
              .catch((err) => [err])
          }
        }
      })

      // API for context web pages
      window.addEventListener('message', ({ data }) => {
        if (typeof data === 'object' && data.type !== undefined) {
          if (data.type === 'OPEN_POPUP_OVERLAY') {
            return Promise.resolve(
              this.overlayManager.openPopup(data.payload.path)
            )
          } else if (data.type === 'CLOSE_OVERLAY') {
            this.closeOverlay()
          }
        }
      })

      const swiper = new Swiper(document.body)
      swiper.on('left', () => this.openOverlay())
      swiper.on('right', () => this.overlayManager.close())
    }
  }

  public waitPairingOverlay(topic?: string, args?: any[]): Promise<void> {
    const me = this
    return new Promise<void>((resolve, reject) => {
      const pairingUrl = browser.runtime.getURL('pairing.html')
      let overlay = me.overlayManager
        .getOverlays()
        .find((x) => x.url === pairingUrl)
      if (!overlay)
        overlay = me.overlayManager.createOverlay({
          url: pairingUrl, 
          title: 'Wallet'
        })

      overlay.open()

      // ToDo: add overlay.onclose

      // ToDo: add timeout?
      overlay.onMessage((topic, message) => {
        if (topic === 'ready') {
          overlay.close()
          resolve()
        }

        if (topic === 'error') {
          reject()
        }
      })

      if (topic) {
        overlay.send(topic, args)
      }
    })
  }

  public waitLoginOverlay(topic?: string, args?: any[]): Promise<void> {
    const me = this
    return new Promise<void>((resolve, reject) => {
      const url = browser.runtime.getURL('login.html')
      //let overlay = this.overlayManager.getOverlays().find(x => x.uri === pairingUrl);
      const overlay = me.overlayManager.createOverlay({
        url, 
        title: 'Login'
      })

      overlay.open()

      overlay.onclose = () => reject('Login rejected')

      // ToDo: add timeout?
      overlay.onMessage((topic, message) => {
        if (topic === 'ready') {
          overlay.onclose = null
          overlay.close()
          resolve()
        }

        if (topic === 'error') {
          reject()
        }
      })

      if (topic) {
        overlay.send(topic, args)
      }
    })
  }

  public waitDeployOverlay(payload: any): Promise<void> {
    const me = this
    return new Promise<void>((resolve, reject) => {
      const pairingUrl = browser.runtime.getURL('deploy.html')
      const overlay = me.overlayManager.createOverlay({
        url: pairingUrl, 
        title: 'Deploy'
      })
      overlay.open(() => overlay.send('data', [payload]))

      // ToDo: add overlay.onclose

      // ToDo: add timeout?
      overlay.onMessage((topic, message) => {
        if (topic === 'ready') {
          overlay.close()
          resolve()
        }

        if (topic === 'error') {
          reject()
        }
      })
    })
  }

  public waitSettingsOverlay(payload: any): Promise<void> {
    const me = this
    return new Promise<void>((resolve, reject) => {
      const pairingUrl = browser.runtime.getURL('settings.html')
      const overlay = me.overlayManager.createOverlay({
        url: pairingUrl,
        title: 'User Settings'
      })
      overlay.open(() => overlay.send('data', [payload]))

      // ToDo: add overlay.onclose

      // ToDo: add timeout?
      overlay.onMessage((topic, message) => {
        if (topic === 'ready') {
          overlay.close()
          resolve()
        }

        if (topic === 'error') {
          reject()
        }
      })
    })
  }

  public async waitGuideOverlay(payload: any): Promise<void> {
    const pairingUrl = browser.runtime.getURL('guide.html')
    const overlay = this.overlayManager.createOverlay({
      url: pairingUrl,
      title: 'Upgrade Guide'
    })
    overlay.open(() => overlay.send('data', [payload]))
  }

  public async waitSystemOverlay(data: {
    activeTab: SystemOverlayTabs
    payload: any
    popup?: boolean
  }): Promise<any> {
    const frameRequestId = generateGuid()

    return new Promise<void>((resolve, reject) => {
      const pairingUrl = browser.runtime.getURL('overlay.html')

      const isTargetLoginSession =
        data.activeTab === SystemOverlayTabs.LOGIN_SESSION &&
        data.payload?.loginRequest?.target
      const parentOverlay = isTargetLoginSession
        ? this.overlayManager
            .getOverlays()
            .find((x) => x.id === data.payload.loginRequest.target)
        : null

      if (parentOverlay) {
        data.popup = true
      }

      const popupOverlay = parentOverlay
        ? this.overlayManager
            .getOverlays()
            .find((x) => x.parent?.id === parentOverlay.id)
        : null
      const overlay =
        popupOverlay ??
        this.overlayManager.createOverlay({
          url: pairingUrl,
          title: 'System',
          source: null,
          hidden: null,
          parent: parentOverlay
        })

      overlay.open(() => overlay.send('data', [frameRequestId, data]))
      overlay.onMessage((topic, data) => {
        const [frameResponseId, message] = data ?? []
        if (frameResponseId === frameRequestId || !frameResponseId) {
          if (topic === 'cancel') {
            overlay.close()
            reject(message ?? 'Unexpected error.')
          } else if (topic === 'ready') {
            if (!frameRequestId) overlay.close()
            overlay.send('close_frame', [frameResponseId])
            resolve(message)
          } else if (topic === 'close') {
            overlay.close()
          }
        }
      })
    })
  }

  public toggleOverlay() {
    if (!this._popupOverlay?.registered) {
      const pairingUrl = browser.runtime.getURL('popup.html')
      this._popupOverlay = this.overlayManager.createOverlay({
        url: pairingUrl,
        title: 'Dapplets',
        source: null,
        hidden: true
      })
      this._popupOverlay.open()
    } else {
      this.overlayManager.toggle()
    }
  }

  public closeOverlay() {
    this.overlayManager && this.overlayManager.unregisterAll()
  }

  public openOverlay() {
    if (this._popupOverlay == null) {
      this.toggleOverlay()
    } else {
      this._popupOverlay.open()
    }
  }

  private async _approveSowaTransaction(sowaId, metadata): Promise<void> {
    const me = this

    return new Promise<void>((resolve, reject) => {
      const pairingUrl = browser.runtime.getURL('sowa.html')
      const overlay = me.overlayManager.createOverlay({
        url: pairingUrl, 
        title: 'SOWA'
      })
      // ToDo: implement multiframe
      overlay.open(() => overlay.send('txmeta', [sowaId, metadata]))
      // ToDo: add timeout?
      overlay.onMessage((topic, message) => {
        if (topic === 'approved') {
          resolve()
          overlay.close()
        }

        if (topic === 'error') {
          reject()
          overlay.close()
        }
      })
    })
  }

  public connect<T>(cfg: { url: string }, defaultState: T): Connection<T> {
    const rpc = new WsJsonRpc(cfg.url)
    const conn = new Connection<T>(rpc)
    const state = this.state(defaultState, 'server')
    conn.state = state
    conn.state.addConnection(conn)
    return conn
  }

  public async wallet(cfg: {
    authMethods: ['ethereum/goerli']
  }): Promise<IEthWallet>
  public async wallet(cfg: {
    authMethods: ('near/testnet' | 'near/mainnet')[]
  }): Promise<INearWallet>
  public async wallet(cfg: {
    authMethods: ('ethereum/goerli' | 'near/testnet' | 'near/mainnet')[]
  }): Promise<IEthWallet | INearWallet>
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
      authMethods?: ('ethereum/goerli' | 'near/testnet' | 'near/mainnet')[]
      type?: 'ethereum' | 'near'
      network?: 'goerli' | 'testnet' | 'mainnet'
      username?: string
      domainId?: number
      fullname?: string
      img?: string
    },
    eventDef?: EventDef<any>,
    app?: string
  ) {
    if (!cfg || !(cfg.authMethods || (cfg.type && cfg.network)))
      throw new Error(
        ' "authMethods" or "type" with "network" are required in Core.wallet().'
      )
    if (cfg.authMethods) {
      cfg.authMethods.forEach((x) => {
        if (!['ethereum/goerli', 'near/testnet', 'near/mainnet'].includes(x))
          throw new Error(
            'The "ethereum/goerli","near/testnet" and "near/mainnet" only are supported in Core.wallet().'
          )
      })
    } else {
      if (cfg.type !== 'near' && cfg.type !== 'ethereum')
        throw new Error(
          'The "ethereum" and "near" only are supported in Core.wallet().'
        )
      if (
        cfg.type === 'near' &&
        !(cfg.network == 'testnet' || cfg.network == 'mainnet')
      )
        throw new Error(
          '"testnet" and "mainnet" network only is supported in "near" type wallet.'
        )
      if (cfg.type === 'ethereum' && cfg.network !== 'goerli')
        throw new Error(
          '"goerli" network only is supported in "ethereum" type wallet.'
        )
    }

    const _authMethods = cfg.authMethods ?? [cfg.type + '/' + cfg.network]

    const isConnected = async () => {
      const { getWalletDescriptors } = await initBGFunctions(browser)
      const sessions = await this.sessions(app)
      const session = sessions.find((x) => _authMethods.includes(x.authMethod))
      if (!session) return false

      // ToDo: remove it when subscription on disconnect event will be implemented
      //       (see: /background/services/walletService.ts/disconnect())
      const descriptors = await getWalletDescriptors()
      const descriptor = descriptors.find((x) => x.type == session.walletType)
      return descriptor ? descriptor.connected : false
    }

    const getSessionObject = async () => {
      const connected = await isConnected()
      if (!connected) return null

      const sessions = await this.sessions(app)
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
      : authMethod === 'ethereum/goerli'
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
        this._session = await me.login(
          { authMethods: _authMethods, secureLogin: 'disabled' },
          {},
          app
        )
        this.authMethod = this._session.authMethod
        this._wallet =
          this.authMethod === 'ethereum/goerli'
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

  public overlay<T>(
    cfg: { name: string; url?: string; title: string; source?: string, module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<any>
  public overlay<T>(
    cfg: { name: string; url?: string; title: string; source?: string, module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T>
  public overlay<T>(
    cfg: { name?: string; url: string; title: string; source?: string, module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T>
  public overlay<T>(
    cfg: { name: string; url: string; title: string; source?: string, module?: any },
    eventDef?: EventDef<any>
  ): OverlayConnection<T | any> {
    const _overlay = this.overlayManager.createOverlay({
        url: cfg.url,
        title: cfg.title,
        source: cfg.source,
        module: cfg.module
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

  // ToDo: remove it or implement!
  contextStarted(contextIds: any[], parentContext?: string): void {}
  contextFinished(contextIds: any[], parentContext?: string): void {}
  onAction(handler: Function) {}
  onHome(handler: Function) {}
  onShareLink(handler: (data: any) => void) {}
  public async getManifest(
    moduleName?: string
  ): Promise<Omit<ModuleInfo, 'interfaces'> & VersionInfo> {
    return null
  }

  public storage: AppStorage

  public async contract(
    type: 'ethereum',
    address: string,
    options: Abi,
    app?: string
  ): Promise<any>
  public async contract(
    type: 'near',
    address: string,
    options: {
      viewMethods: string[]
      changeMethods: string[]
      network?: 'mainnet' | 'testnet'
    },
    app?: string
  ): Promise<any>
  public async contract(
    type: 'near' | 'ethereum',
    address: string,
    options: any,
    app?: string
  ): Promise<any> {
    if (type === 'ethereum') {
      return ethereum.createContractWrapper(
        app,
        { network: 'goerli' },
        address,
        options
      )
    } else if (type === 'near') {
      const network = options.network ?? 'testnet'
      return near.createContractWrapper(app, { network }, address, options)
    } else {
      throw new Error('"ethereum" and "near" contracts only are supported.')
    }
  }

  public getContentDetectors(): ContentDetector[] {
    // Note: take it from a registry in the future
    return [
      {
        contextId: 'video',
        selector: 'video',
      },
    ]
  }

  utils = ethers.utils

  BigNumber = ethers.BigNumber

  ethers = ethers
  near = NearApi

  public starterOverlay() {
    return this.overlay({
      url: browser.runtime.getURL('starter.html'),
      title: 'Starter',
    })
  }

  public createShareLink(
    targetUrl: string,
    modulePayload: any,
    _env?: { contextIds: string[]; registry: string; moduleId: string }
  ): string {
    const groups = /https:\/\/augm\.link\/live\/(.*)/gm.exec(targetUrl)
    const [, targetUrlNoProxy] = groups ?? []
    if (targetUrlNoProxy) targetUrl = targetUrlNoProxy
    const { urlNoPayload } = parseShareLink(targetUrl) // prevent duplicate of base64 payload
    const payload = [
      EXTENSION_VERSION,
      _env.registry,
      _env.moduleId,
      ['*'],
      modulePayload,
    ]
    const base64Payload = btoa(JSON.stringify(payload))
    const WEB_PROXY_URL = 'https://augm.link/live/'
    return WEB_PROXY_URL + urlNoPayload + '#dapplet/' + base64Payload
  }

  public async sessions(moduleName?: string): Promise<LoginSession[]> {
    const { getSessions } = await initBGFunctions(browser)
    const sessions = await getSessions(moduleName)
    return sessions.map((x) => new LoginSession(x))
  }

  public async login(
    request: LoginRequest & LoginHooks,
    settings?: LoginRequestSettings & LoginHooks,
    moduleName?: string
  ): Promise<LoginSession>
  public async login(
    request: (LoginRequest & LoginHooks)[],
    settings?: LoginRequestSettings & LoginHooks,
    moduleName?: string
  ): Promise<LoginSession[]>
  public async login(
    request: (LoginRequest & LoginHooks) | (LoginRequest & LoginHooks)[],
    settings?: LoginRequestSettings & LoginHooks,
    moduleName?: string
  ): Promise<LoginSession | LoginSession[]> {
    if (Array.isArray(request)) {
      return Promise.all(
        request.map((x) => this.login(x, settings, moduleName))
      )
    }

    const _request = { ...request }

    if (settings) {
      Object.assign(_request, settings)
    }

    if (!_request.target) {
      const overlays = this.overlayManager
        .getOverlays()
        .filter((x) => x.source === moduleName)
      const target = overlays.length > 0 ? overlays[0].id : null
      _request.target = target
    }

    if (_request.target && typeof _request.target === 'object') {
      _request.target = _request.target.id
    }

    const { createSession, getThisTab } = await initBGFunctions(browser)
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
