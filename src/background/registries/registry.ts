import { ethers } from 'ethers'
import { ConnectedWalletAccount } from 'near-api-js'
import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'

export interface RegistryConfig {
  url: string
  isDev: boolean
  signer?: ethers.Signer
  nearAccount?: ConnectedWalletAccount
}

export interface Registry {
  isAvailable: boolean
  error: string
  url: string
  isDev: boolean
  blockchain: string

  getModuleInfo(
    contextIds: string[],
    users: string[]
  ): Promise<{ [contextId: string]: ModuleInfo[] }>
  getModuleInfoByName(name: string): Promise<ModuleInfo>
  getVersionNumbers(name: string, branch: string): Promise<string[]>
  getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo>
  getAllDevModules({
    users,
  }: {
    users: string[]
  }): Promise<{ module: ModuleInfo; versions: VersionInfo[] }[]>
  addModule(module: ModuleInfo, version: VersionInfo, reservationPeriod): Promise<void>
  getOwnership(moduleName: string): Promise<string>
  transferOwnership(moduleName: string, newAccount: string, oldAccount: string): Promise<void>
  getContextIds(moduleName: string): Promise<string[]>
  addContextId(moduleName: string, contextId: string): Promise<void>
  removeContextId(moduleName: string, contextId: string): Promise<void>
  getAdmins(moduleName: string): Promise<string[]>
  addAdmin(moduleName: string, adressAdmin: string): Promise<void>
  removeAdmin(moduleName: string, adressAdmin: string): Promise<void>
  editModuleInfo(module: ModuleInfo): Promise<void>
  getModuleNftUrl(moduleName: string): Promise<string>
  getStakeStatus(appId: string): Promise<string>
  calcExtendedStake(appId: string, secondsDuration: number): Promise<number>
  calcStake(duration: number): Promise<number>
  stakes(appId: string, parameters): Promise<number>
  burnDUC(moduleName: string): Promise<void>
  extendReservation(moduleName: string, reservationPeriod: number): Promise<void>
  stakingToken(): Promise<string>
  burnShare(): Promise<number> 
  
}
