import { Runtime } from 'webextension-polyfill'
import ManifestDTO from '../background/dto/manifestDTO'
import VersionInfo from '../background/models/versionInfo'

export type ValueOf<T> = T[keyof T]

export type Falsy = false | 0 | '' | null | undefined

export type DefaultConfig = {
  [Environments.Dev]?: {
    [key: string]: any
  }
  [Environments.Test]?: {
    [key: string]: any
  }
  [Environments.Main]?: {
    [key: string]: any
  }
}

export type SchemaConfig = any

export enum Environments {
  Dev = 'dev',
  Test = 'test',
  Main = 'main',
}

export enum DefaultSigners {
  EXTENSION = 'extension',
}

export enum ChainTypes {
  ETHEREUM_SEPOLIA = 'ethereum/sepolia',
  ETHEREUM_XDAI = 'ethereum/xdai',
  NEAR_TESTNET = 'near/testnet',
  NEAR_MAINNET = 'near/mainnet',
}

export enum WalletTypes {
  WALLETCONNECT = 'walletconnect',
  METAMASK = 'metamask',
  NEAR = 'near',
  DAPPLETS = 'dapplets',
}

export enum NearNetworks {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export enum OverlayStorages {
  Centralized = 'centralized',
  Decentralized = 'decentralized',
}

export interface WalletDescriptor {
  chain: ChainTypes
  type: WalletTypes
  meta: {
    icon: string
    name: string
    description: string
  } | null
  connected: boolean
  available: boolean
  account: string
  chainId: number
  apps: string[]
  default: boolean
  lastUsage: string
}

export interface WalletDescriptorWithCAMainStatus extends WalletDescriptor {
  accountActive: boolean
}

export type ModuleId = {
  name: string
  branch: string
  version: string
}

export enum SystemOverlayTabs {
  DAPPLET_CONFIRMATION = 'DAPPLET_CONFIRMATION',
  LOGIN_SESSION = 'LOGIN_SESSION',
  CONNECTED_ACCOUNTS = 'CONNECTED_ACCOUNTS',
}

export type NearNetworkConfig = {
  networkId: string
  nodeUrl: string
  walletUrl: string
  helperUrl?: string
  explorerUrl?: string
}

export type EthereumNetwrokConfig = {
  networkId: string
  chainId: number
  nodeUrl: string
  explorerUrl?: string
  ensAddress?: string
}

export type LoginRequest = {
  authMethods: string[]
  timeout?: number
  role?: string
  help?: string
  target?: string | any
  secureLogin?: SecureLoginOptions | ValueOf<SecureLoginOptions>
  reusePolicy?: ReusePolicyOptions | ValueOf<ReusePolicyOptions>
  from?: LoginRequestFromOptions | ValueOf<LoginRequestFromOptions>
  contractId?: string // ToDo: rethink this parameter, needed for NEAR only
  creatingLoginConfirmationFailed?: boolean
}

export enum SecureLoginOptions {
  Required = 'required',
  Optional = 'optional',
  Disabled = 'disabled',
}

export enum ReusePolicyOptions {
  Auto = 'auto',
  Manual = 'manual',
  Disabled = 'disabled',
}

export enum LoginRequestFromOptions {
  Me = 'me',
  Any = 'any',
}

export type SystemOverlayData = {
  frameId: string
  activeTab: string
  popup: boolean
  payload: any
}

export enum UrlAvailability {
  AVAILABLE = 'AVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export type StorageRef = {
  hash: string
  uris: string[]
}

export type TAlertAndConfirmPayload = {
  title: string
  message: string
  icon?: StorageRef
  type: 'alert' | 'confirm'
}

export type TConnectedAccountsVerificationRequestInfo = {
  firstAccount: string
  secondAccount: string
  isUnlink: boolean
  firstProofUrl: string
  secondProofUrl: string
  transactionSender: string
}

export type TConnectedAccountStatus = {
  isMain: boolean
}

export type TConnectedAccount = {
  id: string
  status: TConnectedAccountStatus
}

export enum ConnectedAccountsRequestStatus {
  NotFound = 'not found',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum ConnectedAccountsPairStatus {
  Processing = 'Processing',
  Connected = 'Connected',
  Error = 'Error',
}

export interface IConnectedAccountUser {
  img: string
  name: string
  origin: string
  accountActive: boolean
  walletType?: WalletTypes
}

export interface IConnectedAccountsPair {
  firstAccount: IConnectedAccountUser
  secondAccount: IConnectedAccountUser
  statusName: ConnectedAccountsPairStatus
  statusMessage: string
  closeness: number
  pendingRequestId?: number
}

export type EthSignature = {
  sig: string
  v: number
  mc: boolean
}

export type ManifestAndDetails = ManifestDTO & {
  isLoading: boolean
  isActionLoading: boolean
  isHomeLoading: boolean
  error: string
  versions: string[]
}

export type DappletLoadingResult = {
  name: string
  branch: string
  version: string
  runtime?: DappletRuntimeResult
  error?: string
}

export type DappletRuntimeResult = {
  isActionHandler: boolean
  isHomeHandler: boolean
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type MessageWrapperRequest = {
  request: {
    handler: string
    type: string
    payload: {
      path: string
      args: JsonValue[]
    }
  }
  sender: Runtime.MessageSender
}

export type ContentDetector = {
  contextId: string
  selector: string
}

export type SandboxEnvironmentVariables = {
  preferedOverlayStorage: string
  swarmGatewayUrl: string
}

export type SandboxInitializationParams = {
  manifest: VersionInfo
  defaultConfig: DefaultConfig
  schemaConfig: SchemaConfig
  env: SandboxEnvironmentVariables
}

export type ContextBuilder = {
  [key: string]: ContextBuilder | string
}

export type ParserConfig = {
  themes?: {
    DARK?: string
    LIGHT?: string
  }
  contexts: {
    [contextName: string]: {
      containerSelector: string
      contextSelector?: string
      widgets?: {
        [widgetName: string]: {
          styles?: string
          insertionPoint: string
          insert?: string
        }
      }
      events?: {
        [eventName: string]: {
          element: string
          listen: string
          data?: {
            [key: string]: string
          }
        }
      }
      contextBuilder: ContextBuilder
      childrenContexts?: string[]
    }
  }
}

/**
 * @description
 * The base type for all module-level events used by the EventBus system.
 * */
export type BaseEvent = {
  namespace: string
  type: string
}
