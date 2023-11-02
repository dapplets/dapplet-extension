import { hexlify } from '@ethersproject/bytes'
import { toUtf8Bytes } from '@ethersproject/strings'
import { SECURE_AUTH_METHODS } from '../../common/constants'
import { generateGuid } from '../../common/generateGuid'
import { isValidEnumValue } from '../../common/helpers'
import {
  ChainTypes,
  LoginRequest,
  LoginRequestFromOptions,
  ReusePolicyOptions,
  SecureLoginOptions,
  WalletTypes,
} from '../../common/types'
import LoginConfirmationBrowserStorage from '../browserStorages/loginConfirmationBrowserStorage'
import LoginSessionBrowserStorage from '../browserStorages/loginSessionBrowserStorage'
import SessionEntryBrowserStorage from '../browserStorages/sessionEntryBrowserStorage'
import LoginConfirmation from '../models/loginConfirmation'
import LoginSession from '../models/loginSession'
import SessionEntry from '../models/sessionEntry'
import { NearWallet } from '../wallets/near/interface'
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
      .filter((x) => (request.from === LoginRequestFromOptions.Me ? x.from === moduleName : true))
      .filter(
        (x) =>
          !!suitableWallets.find(
            (y) => y.chain === x.authMethod && y.type === x.wallet && x.address === y.account
          )
      )
      .filter((x) =>
        // do not include login confirmations from another contracts
        x.authMethod === ChainTypes.NEAR_MAINNET || x.authMethod === ChainTypes.NEAR_TESTNET
          ? x.contractId === request.contractId
          : true
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
    tabId: number,
    wasError?: {
      creatingLoginConfirmationFailed: boolean
    }
  ): Promise<LoginSession> {
    console.log('wasError', wasError)
    request.timeout = request.timeout ?? DEFAULT_REQUEST_TIMEOUT
    request.secureLogin = request.secureLogin ?? SecureLoginOptions.Disabled
    request.reusePolicy = request.reusePolicy ?? ReusePolicyOptions.Disabled
    request.from = request.from ?? LoginRequestFromOptions.Any
    if (wasError?.creatingLoginConfirmationFailed) request.creatingLoginConfirmationFailed = true

    if (!request.authMethods || request.authMethods.length === 0) {
      throw new Error(`"authMethods" is required.`)
    }

    if (!isValidEnumValue(SecureLoginOptions, request.secureLogin)) {
      throw new Error('Invalid "secureLogin" value.')
    }

    if (!isValidEnumValue(ReusePolicyOptions, request.reusePolicy)) {
      throw new Error('Invalid "reusePolicy" value.')
    }

    if (request.secureLogin === SecureLoginOptions.Required) {
      for (const authMethod of request.authMethods) {
        if (!SECURE_AUTH_METHODS.includes(authMethod)) {
          throw new Error(`${authMethod} doesn't support secure login.`)
        }

        if (
          (authMethod === ChainTypes.NEAR_MAINNET || authMethod === ChainTypes.NEAR_TESTNET) &&
          !request.contractId
        ) {
          throw new Error(
            'The parameter `contractId` is required for secure login in NEAR Protocol'
          )
        }
      }
    }

    console.log('moduleName', moduleName)
    console.log('request', request)
    console.log('tabId', tabId)
    const overlayResult = await this._overlayService.openLoginSessionOverlay(
      moduleName,
      request,
      tabId
    )
    console.log('overlayResult', overlayResult)

    const { wallet, chain } = overlayResult
    let { confirmationId } = overlayResult

    if (
      request.secureLogin === SecureLoginOptions.Required &&
      request.reusePolicy === ReusePolicyOptions.Manual &&
      !confirmationId
    ) {
      throw new Error('LoginConfirmation must be selected in secure login mode.')
    }

    if (!request.authMethods.includes(chain)) {
      throw new Error('Invalid auth method selected.')
    }

    const descriptors = await this._walletService.getWalletDescriptors()

    if (
      descriptors.findIndex((x) => x.connected && x.type === wallet && x.chain === chain) === -1
    ) {
      throw new Error('Selected wallet is disconnected.')
    }

    if (request.secureLogin === SecureLoginOptions.Required) {
      const loginConfirmations = await this.getSuitableLoginConfirmations(moduleName, request)

      // Which reuse policy is defined by dapplet developer?
      if (request.reusePolicy === ReusePolicyOptions.Manual) {
        // manual - a user must select login confirmation manually and it must exist
        if (loginConfirmations.findIndex((x) => x.loginConfirmationId === confirmationId) === -1) {
          throw new Error('Login confirmation is expired.')
        }
      } else if (request.reusePolicy === ReusePolicyOptions.Auto && loginConfirmations.length > 0) {
        // auto - the extension selects any available login confirmation automatically if exists
        //        if it doesn't exist, then create a new one below
        confirmationId = loginConfirmations[0].loginConfirmationId
      } else {
        // disabled - the extension creates a new login confirmation every time, reusing is disabled
        const loginConfirmation = await this.createLoginConfirmation(
          moduleName,
          request,
          chain,
          wallet
        )
        if (!loginConfirmation)
          this.createSession(moduleName, request, tabId, {
            creatingLoginConfirmationFailed: !loginConfirmation,
          })
        confirmationId = loginConfirmation.loginConfirmationId
      }
    }

    const session = new LoginSession()
    const creationDate = new Date()
    session.sessionId = generateGuid()
    session.moduleName = moduleName
    session.authMethod = chain
    session.walletType = wallet
    session.expiresAt = new Date(creationDate.getTime() + request.timeout).toISOString()
    session.createdAt = creationDate.toISOString()
    session.loginConfirmationId = confirmationId

    await this._loginSessionBrowserStorage.create(session)

    return session
  }

  async createLoginConfirmation(
    moduleName: string,
    request: LoginRequest,
    chain: ChainTypes,
    wallet: WalletTypes
  ): Promise<LoginConfirmation> {
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

    if (chain === ChainTypes.ETHEREUM_GOERLI || chain === ChainTypes.ETHEREUM_XDAI) {
      loginConfirmation.address = await genericWallet.getAddress()
      loginConfirmation.signature = await genericWallet.signMessage(
        hexlify(toUtf8Bytes(loginConfirmation.loginMessage()))
      )
    } else if (chain === ChainTypes.NEAR_MAINNET || chain === ChainTypes.NEAR_TESTNET) {
      if (!request.contractId) {
        throw new Error('The parameter `contractId` is required for secure login in NEAR Protocol')
      }

      const isSuccessfulResult = await (genericWallet as NearWallet).createAccessKey(
        request.contractId,
        loginConfirmation.loginConfirmationId
      )

      if (!isSuccessfulResult) return null

      loginConfirmation.address = await genericWallet.getAddress()
      loginConfirmation.contractId = request.contractId
    } else {
      throw new Error('Secure login is not supported for this auth method')
    }

    await this._loginConfirmationBrowserStorage.create(loginConfirmation)

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
