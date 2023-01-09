import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'

export interface Registry {
  isAvailable: boolean
  error: string
  url: string
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
  addModule(module: ModuleInfo, version: VersionInfo): Promise<void>
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
}
