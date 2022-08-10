import { ethers } from 'ethers'
import * as nearAPI from 'near-api-js'
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants'
import { typeOfUri, UriTypes } from '../../common/helpers'
import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'
import { Registry, StorageRef } from './registry'

type NearStorageRef = {
  hash: string // bytes32
  uris: string[] // bytes[]
}

type NearModuleInfo = {
  moduleType: number // u8
  name: string // string
  owner: string // string
}

type NearDependency = {
  name: string
  branch: string
  version: string
}

type NearVersionInfo = {
  name: string
  branch: string
  version: string
  owner: string
  moduleType: number
  title: string
  description: string
  icon: NearStorageRef
  reference: NearStorageRef
  docs: NearStorageRef
  dependencies: NearDependency[]
  interfaces: NearDependency[]
}

const moduleTypesMap: { [key: number]: ModuleTypes } = {
  1: ModuleTypes.Feature,
  2: ModuleTypes.Adapter,
  3: ModuleTypes.Library,
  4: ModuleTypes.Interface,
}

// ToDo: errors from here don't reach contentscript!
export class NearRegistry implements Registry {
  public isAvailable = true
  public error: string = null
  public blockchain = 'near'

  private _contract: any
  private _moduleInfoCache = new Map<string, Map<string, ModuleInfo[]>>()

  constructor(public url: string, private _nearAccount: nearAPI.ConnectedWalletAccount) {
    this._contract = new nearAPI.Contract(this._nearAccount, this.url, {
      viewMethods: [
        'getLastVersionInfo',
        'getLastVersionsByContextIds',
        'getModules',
        'getVersionInfo',
        'getModuleNames',
        'getModuleInfoByNames',
        'getModuleBranches',
        'getModuleInfoByName',
        'getAllContextIds',
        'getAllListers',
        'getAllModules',
        'getContextIdsByModule',
        'getModulesByContextId',
        'getModuleInfoBatch',
        'getModuleInfo',
        'getInterfacesOfModule',
        'getVersionNumbers',
      ],
      changeMethods: [
        'addModuleVersion',
        'transferOwnership',
        'createModule',
        'addContextId',
        'addAdmin',
        'addModuleWithContexts',
        'removeContextId',
        'removeAdmin',
      ],
    })
  }

  public async getModuleInfo(
    contextIds: string[],
    users: string[]
  ): Promise<{ [contextId: string]: ModuleInfo[] }> {
    try {
      users = users.filter((x) => typeOfUri(x) === UriTypes.Near)
      const usersCacheKey = users.join(';')
      if (!this._moduleInfoCache.has(usersCacheKey))
        this._moduleInfoCache.set(usersCacheKey, new Map())
      if (
        contextIds
          .map((c) => this._moduleInfoCache.get(usersCacheKey).has(c))
          .every((c) => c === true)
      ) {
        const cachedResult = Object.fromEntries(
          contextIds.map((c) => [c, this._moduleInfoCache.get(usersCacheKey).get(c)])
        )
        return cachedResult
      }

      const moduleInfosByCtx: NearVersionInfo[][] =
        await this._contract.getLastVersionsByContextIds({
          ctxIds: contextIds,
          users: users,
          maxBufLen: 0,
        })
      this.isAvailable = true
      this.error = null

      const result = Object.fromEntries(
        moduleInfosByCtx.map((modules, i) => {
          const ctx = contextIds[i]
          const mis = modules.map((m) => {
            const mi = new ModuleInfo()
            mi.type = moduleTypesMap[m.moduleType]
            mi.name = m.name
            mi.title = m.title
            mi.description = m.description
            mi.author = m.owner
            mi.icon = this._fromNearStorageRef(m.icon)
            mi.interfaces = m.interfaces.map((x) => x.name)
            mi.isUnderConstruction = false
            return mi
          })

          if (!this._moduleInfoCache.get(usersCacheKey).has(ctx)) {
            this._moduleInfoCache.get(usersCacheKey).set(ctx, mis)
          }

          return [ctx, mis]
        })
      )

      return result
    } catch (err) {
      this.isAvailable = false
      this.error = err.message
      console.error('Error in EthRegistry class when module info is fetching', err, {
        method: 'getModuleInfo',
        args: { contextIds, users },
      })
      throw err
    }
  }

  public async getModuleInfoByName(name: string): Promise<ModuleInfo> {
    try {
      const v: NearVersionInfo | null = await this._contract.getLastVersionInfo({ name })
      if (!v) return null

      const mi = new ModuleInfo()
      mi.type = moduleTypesMap[v.moduleType]
      mi.name = v.name
      mi.title = v.title
      mi.description = v.description
      mi.author = v.owner
      mi.icon = this._fromNearStorageRef(v.icon)
      mi.interfaces = v.interfaces.map((x) => x.name)
      mi.registryUrl = this.url
      mi.isUnderConstruction = false
      return mi
    } catch (err) {
      console.error(err)
      return null
    }
  }

  public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
    try {
      const versions = await this._contract.getVersionNumbers({ name, branch })
      this.isAvailable = true
      this.error = null
      return versions
    } catch (err) {
      this.isAvailable = false
      this.error = err.message
      throw err
    }
  }

  public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
    try {
      const response = await this._contract.getVersionInfo({ name, branch, version })

      if (!response) return null

      const dto: NearVersionInfo = response
      const moduleType: number = response.moduleType

      const vi = new VersionInfo()
      vi.registryUrl = this.url
      vi.name = name
      vi.branch = branch
      vi.version = version
      vi.type = moduleTypesMap[moduleType]
      ;(vi.dist = this._fromNearStorageRef(dto.reference)),
        (vi.dependencies = Object.fromEntries(dto.dependencies.map((d) => [d.name, d.version])))
      vi.interfaces = Object.fromEntries(dto.interfaces.map((d) => [d.name, d.version]))

      this.isAvailable = true
      this.error = null

      return vi
    } catch (err) {
      this.isAvailable = false
      this.error = err.message
      throw err
    }
  }

  public async getAllDevModules({
    users,
  }: {
    users: string[]
  }): Promise<{ module: ModuleInfo; versions: VersionInfo[] }[]> {
    return Promise.resolve([])
  }

  public async addModule(module: ModuleInfo, version: VersionInfo): Promise<void> {
    if (!version)
      throw new Error("NEAR Registry doesn't support uploading of modules under construction.")

    const moduleType = parseInt(
      Object.entries(moduleTypesMap).find(([k, v]) => v === module.type)[0]
    )

    const mInfo: NearModuleInfo = {
      moduleType: moduleType,
      name: module.name,
      owner: this._nearAccount.accountId,
    }

    const vInfo: NearVersionInfo = {
      name: module.name,
      branch: version.branch,
      version: version.version,
      owner: this._nearAccount.accountId,
      moduleType: moduleType,
      title: module.title,
      description: module.description,
      icon: this._toNearStorageRef(module.icon),
      reference: this._toNearStorageRef(version.dist),
      docs: null, // ToDo: this._encodeStorageRef(version.docs),
      dependencies:
        (version.dependencies &&
          Object.entries(version.dependencies).map(([k, v]) => ({
            name: k,
            branch: 'default',
            version: typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME],
          }))) ||
        [],
      interfaces:
        (version.interfaces &&
          Object.entries(version.interfaces).map(([k, v]) => ({
            name: k,
            branch: 'default',
            version: typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME],
          }))) ||
        [],
    }

    await this._contract.addModuleWithContexts(
      {
        contextIds: module.contextIds,
        mInfo: mInfo,
        vInfo: vInfo,
      },
      300000000000000
    )
  }

  // ToDo: use getModuleInfoByName instead
  public async getOwnership(name: string) {
    try {
      const mi = await this._contract.getModuleInfoByName({ name })
      return mi?.owner
    } catch {
      return null
    }
  }

  public async transferOwnership(moduleName: string, newAccount: string, oldAccount: string) {
    await this._contract.transferOwnership({
      moduleName: moduleName,
      newOwner: newAccount,
    })
  }

  public async getContextIds(moduleName: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  public async addContextId(moduleName: string, contextId: string) {
    await this._contract.addContextId({ contextId, moduleName })
  }

  public async removeContextId(moduleName: string, contextId: string) {
    await this._contract.removeContextId({ contextId, moduleName })
  }
  public async getAdmins(moduleName: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }

  public async addAdmin(moduleName: string, adressAdmin: string) {
    await this._contract.addAdmin({ adressAdmin, moduleName })
  }

  public async removeAdmin(moduleName: string, adressAdmin: string) {
    await this._contract.removeAdmin({ adressAdmin, moduleName })
  }

  public async editModuleInfo(module: ModuleInfo): Promise<void> {
    throw new Error('Not implemented')
  }

  private _toNearStorageRef(ref: StorageRef): NearStorageRef {
    if (ref === null) return null
    return {
      hash: ethers.utils.base64.encode(ref.hash),
      uris: ref.uris.map((u) => ethers.utils.base64.encode(ethers.utils.toUtf8Bytes(u))),
    }
  }

  private _fromNearStorageRef(ref: NearStorageRef): StorageRef {
    if (ref === null) return null
    return {
      hash: ethers.utils.hexlify(ethers.utils.base64.decode(ref.hash)),
      uris: ref.uris.map((u) => ethers.utils.toUtf8String(ethers.utils.base64.decode(u))),
    }
  }
}
