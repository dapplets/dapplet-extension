import { hexlify } from '@ethersproject/bytes'
import { toUtf8Bytes } from '@ethersproject/strings'
import { generateGuid } from '../../common/helpers'
import { ChainTypes, LoginRequest, WalletTypes } from '../../common/types'
import LoginConfirmationBrowserStorage from '../browserStorages/loginConfirmationBrowserStorage'
import LoginSessionBrowserStorage from '../browserStorages/loginSessionBrowserStorage'
import SessionEntryBrowserStorage from '../browserStorages/sessionEntryBrowserStorage'
import LoginConfirmation from '../models/loginConfirmation'
import LoginSession from '../models/loginSession'
import SessionEntry from '../models/sessionEntry'
import { OverlayService } from './overlayService'
import { WalletService } from './walletService'

const DEFAULT_REQUEST_TIMEOUT = 1000 * 60 * 60 * 24 * 7

export class SessionService {
  private _loginConfirmationBrowserStorage = new LoginConfirmationBrowserStorage()
  private _loginSessionBrowserStorage = new LoginSessionBrowserStorage()
  private _sessionEntryBrowserStorage = new SessionEntryBrowserStorage()

  constructor(private _walletService: WalletService, private _overlayService: OverlayService) {}

  async getSessions(moduleName: string): Promise<LoginSession[]> {
    const sessions = await this._loginSessionBrowserStorage.getAll(
      (x) => x.moduleName === moduleName
    )
    return sessions.filter((x) => !x.isExpired())
  }

  async getSession(sessionId: string): Promise<LoginSession> {
    return await this._loginSessionBrowserStorage.getById(sessionId)
  }

  async getSuitableLoginConfirmations(
    moduleName: string,
    request: LoginRequest
  ): Promise<LoginConfirmation[]> {
    let confirmations = await this._loginConfirmationBrowserStorage.getAll()

    if (confirmations.length === 0) return []

    const descriptors = await this._walletService.getWalletDescriptors()
    const suitableWallets = descriptors
      .filter((x) => x.connected)
      .filter((x) => (x.chain ? request.authMethods.includes(x.chain) : true))

    confirmations = confirmations
      .filter((x) => !x.isExpired())
      .filter((x) => request.authMethods.includes(x.authMethod))
      .filter((x) => (request.from === 'me' ? x.from === moduleName : true))
      .filter(
        (x) =>
          !!suitableWallets.find(
            (y) => y.chain === x.authMethod && y.type === x.wallet && x.address === y.account
          )
      )

    return confirmations
  }

  async isValidSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId)
    if (!session) return false
    if (session.isExpired()) return false
    return true
  }

  async killSession(sessionId: string): Promise<void> {
    await this.clearItems(sessionId)
    await this._loginSessionBrowserStorage.deleteById(sessionId)
  }

  async killSessionsByWallet(walletType: string): Promise<void> {
    const sessions = await this._loginSessionBrowserStorage.getAll(
      (x) => x.walletType === walletType
    )
    await Promise.all(sessions.map((x) => this.killSession(x.sessionId)))
  }

  async createSession(
    moduleName: string,
    request: LoginRequest,
    tabId: number
  ): Promise<LoginSession> {
    console.log('into the createSession()')
    console.log('moduleName', moduleName)
    console.log('tabId', tabId)
    console.log('request', request)
    request.timeout = request.timeout ?? DEFAULT_REQUEST_TIMEOUT
    request.secureLogin = request.secureLogin ?? 'disabled'
    request.from = request.from ?? 'any'

    if (!request.authMethods || request.authMethods.length === 0)
      throw new Error(`"authMethods" is required.`)

    if (request.secureLogin === 'required') {
      for (const authMethod of request.authMethods) {
        if (ChainTypes.ETHEREUM_GOERLI !== authMethod && ChainTypes.ETHEREUM_XDAI !== authMethod) {
          throw new Error(`${authMethod} doesn't support secure login.`)
        }
      }
    }

    if (!['disabled', 'optional', 'required'].includes(request.secureLogin))
      throw new Error('Invalid "secureLogin" value.')

    const { wallet, chain, confirmationId } = await this._overlayService.openLoginSessionOverlay(
      moduleName,
      request,
      tabId
    )
    console.log('wallet', wallet)
    console.log('chain', chain)
    console.log('confirmationId', confirmationId)

    if (request.secureLogin === 'required' && !confirmationId)
      throw new Error('LoginConfirmation must be selected in secure login mode.')
    if (!request.authMethods.includes(chain)) throw new Error('Invalid auth method selected.')

    const descriptors = await this._walletService.getWalletDescriptors()
    if (
      descriptors.findIndex((x) => x.connected && x.type === wallet && x.chain === chain) === -1
    ) {
      throw new Error('Selected wallet is disconnected.')
    }

    if (confirmationId) {
      const loginConfirmations = await this.getSuitableLoginConfirmations(moduleName, request)
      if (loginConfirmations.findIndex((x) => x.loginConfirmationId === confirmationId) === -1) {
        throw new Error('Login confirmation is expired.')
      }
    }

    await this._walletService.disconnectWallet(chain, wallet)
    const res = await this._walletService.connectWallet(chain, wallet, {
      contractId: request.contractId,
    })
    console.log('!!!res', res)

    const session = new LoginSession()
    const creationDate = new Date()
    session.sessionId = generateGuid()
    session.moduleName = moduleName
    session.authMethod = chain
    session.walletType = wallet
    session.expiresAt = new Date(creationDate.getTime() + request.timeout).toISOString()
    session.createdAt = creationDate.toISOString()
    session.loginConfirmationId = confirmationId
    session.contractId = request.contractId
    console.log('LoginSession', session)

    await this._loginSessionBrowserStorage.create(session)

    return session
  }

  async createLoginConfirmation(
    moduleName: string,
    request: LoginRequest,
    chain: ChainTypes,
    wallet: WalletTypes
  ): Promise<LoginConfirmation> {
    console.log('into createLoginConfirmation')
    console.log('moduleName', moduleName)
    console.log('request', request)
    console.log('chain', chain)
    console.log('wallet', wallet)
    const loginConfirmation = new LoginConfirmation()
    const creationDate = new Date()
    const expiresAt = new Date(creationDate.getTime() + request.timeout).toISOString()
    loginConfirmation.loginConfirmationId = generateGuid()
    loginConfirmation.authMethod = chain
    loginConfirmation.wallet = wallet
    loginConfirmation.timeout = expiresAt
    loginConfirmation.from = moduleName
    loginConfirmation.role = request.role
    loginConfirmation.help = request.help
    loginConfirmation.expiresAt = expiresAt
    loginConfirmation.createdAt = creationDate.toISOString()

    const genericWallet = await this._walletService.getGenericWallet(chain, wallet)
    const signature = await genericWallet.signMessage(
      hexlify(toUtf8Bytes(loginConfirmation.loginMessage()))
    )
    loginConfirmation.signature = signature

    const address = await genericWallet.getAddress()
    loginConfirmation.address = address

    await this._loginConfirmationBrowserStorage.create(loginConfirmation)

    console.log('loginConfirmation', loginConfirmation)
    return loginConfirmation
  }

  async getItem(sessionId: string, key: string): Promise<any> {
    return this._sessionEntryBrowserStorage.getBySessionKey(sessionId, key)
  }

  async setItem(sessionId: string, key: string, value: any): Promise<void> {
    const sessionEntry = new SessionEntry()
    sessionEntry.sessionId = sessionId
    sessionEntry.key = key
    sessionEntry.value = value
    await this._sessionEntryBrowserStorage.create(sessionEntry)
  }

  async removeItem(sessionId: string, key: string): Promise<void> {
    return this._sessionEntryBrowserStorage.deleteBySessionKey(sessionId, key)
  }

  async clearItems(sessionId: string): Promise<void> {
    return this._sessionEntryBrowserStorage.clearBySessionKey(sessionId)
  }
}
