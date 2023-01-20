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
  ETHEREUM_GOERLI = 'ethereum/goerli',
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

export type WalletDescriptor = {
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
}

export type LoginRequest = {
  authMethods: string[]
  timeout?: number
  role?: string
  help?: string
  target?: string | any
  secureLogin?: 'required' | 'optional' | 'disabled'
  from?: 'me' | 'any'
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
