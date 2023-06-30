import * as ethers from 'ethers'
import * as NearApi from 'near-api-js'
import { LoginRequest } from '../../common/types'
import { initBGFunctions, sendRequest } from '../communication'
import { AppStorage } from './appStorage'
import ConnectedAccounts from './connectedAccounts'
import * as ethereum from './ethereum'
import { LoginSession } from './login/login-session'
import { LoginHooks, LoginRequestSettings } from './login/types'
import * as near from './near'

type Abi = any

export class Core {
  public utils = ethers.utils
  public BigNumber = ethers.BigNumber
  public ethers = ethers
  public near = NearApi
  public connectedAccounts: ConnectedAccounts
  public storage: AppStorage

  constructor(connectedAccounts: ConnectedAccounts, storage: AppStorage) {
    this.connectedAccounts = connectedAccounts
    this.storage = storage
  }

  /*
  Functions need to be implemented for Tipping Dapplet:
  ~ Core.onConnectedAccountsUpdate
  ~ Core.onWalletsUpdate
  
  + Core.storage.get
  
  + Core.sessions
  + Core.login
  + Core.contract
  
  + Core.getPreferredConnectedAccountsNetwork
  + Core.connectedAccounts.getNet
  + Core.connectedAccounts.requestVerification
  + Core.connectedAccounts.getPendingRequests
  + Core.connectedAccounts.getVerificationRequest
  + Core.connectedAccounts.getRequestStatus
  */

  public async confirm(message: string): Promise<boolean> {
    return sendRequest('confirm', message)
  }

  public async alert(message: string): Promise<void> {
    return sendRequest('alert', message)
  }

  public onConnectedAccountsUpdate(listener: () => void) {
    // ToDo: implement this
  }

  public onWalletsUpdate(listener: () => void) {
    // ToDo: implement this
  }

  async getPreferredConnectedAccountsNetwork(): Promise<string> {
    const { getPreferredConnectedAccountsNetwork } = initBGFunctions()
    return getPreferredConnectedAccountsNetwork()
  }

  public async contract(
    type: 'ethereum' | 'ethereum/xdai',
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
    type: 'near' | 'ethereum' | 'ethereum/xdai',
    address: string,
    options: any,
    app?: string
  ): Promise<any> {
    if (type === 'ethereum') {
      return ethereum.createContractWrapper(app, { network: 'goerli' }, address, options)
    } else if (type === 'ethereum/xdai') {
      return ethereum.createContractWrapper(app, { network: 'xdai' }, address, options)
    } else if (type === 'near') {
      const network = options.network ?? 'testnet'
      return near.createContractWrapper(app, { network }, address, options)
    } else {
      throw new Error('"ethereum", "ethereum/xdai" and "near" contracts only are supported.')
    }
  }

  public async sessions(moduleName?: string): Promise<LoginSession[]> {
    const { getSessions } = initBGFunctions()
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
      return Promise.all(request.map((x) => this.login(x, settings, moduleName)))
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
}
