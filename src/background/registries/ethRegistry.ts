import { Cacheable } from 'caching-decorator'
import * as ethers from 'ethers'
import * as semver from 'semver'
import * as EventBus from '../../common/global-event-bus'
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants'
import {
  convertISODateToTimestamp,
  convertTimestampToISODate,
  getBitFromHex,
  mergeDedupe,
  networkName,
  typeOfUri,
  UriTypes,
} from '../../common/helpers'
import { StorageRef } from '../../common/types'
import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'
import abi from './ethRegistryAbi'
import nftAbi from './nftContractAbi'
import { Registry, RegistryConfig } from './registry'
import abiZoo from './tokenZooAbi'
export interface Stake {
  amount: number
  duration: number
  endsAt: number
}
type EthStorageRef = {
  hash: string // bytes32
  uris: string[] // bytes[]
}

type EthModuleInfo = {
  moduleType: number // uint8
  name: string // string
  title: string // string
  description: string // string
  image: EthStorageRef
  manifest: EthStorageRef
  icon: EthStorageRef
  owner: string // bytes32
  interfaces: string[] // string[]
  flags: ethers.BigNumber // uint
}

type EthDependencyDto = {
  name: string
  branch: string
  version: string // bytes4
}

type EthVersionInfoDto = {
  branch: string // string
  version: string // bytes4
  binary: EthStorageRef
  dependencies: EthDependencyDto[]
  interfaces: EthDependencyDto[] // bytes32[]
  flags: number // uint8
  extensionVersion: string
  createdAt: ethers.BigNumber // uint256
}

type LinkString = { prev: string; next: string }

const moduleTypesMap: { [key: number]: ModuleTypes } = {
  1: ModuleTypes.Feature,
  2: ModuleTypes.Adapter,
  3: ModuleTypes.Library,
  4: ModuleTypes.Interface,
}

const BLOCKTIME_MS = 15000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

const EMPTY_STORAGE_REF = {
  hash: ZERO_BYTES32,
  uris: [],
}

const EMPTY_VERSION: EthVersionInfoDto = {
  branch: '',
  version: '0x00000000',
  binary: EMPTY_STORAGE_REF,
  dependencies: [],
  interfaces: [],
  flags: 0,
  extensionVersion: '0x00000000',
  createdAt: ethers.BigNumber.from(0),
}

// ToDo: errors from here don't reach contentscript!
export class EthRegistry implements Registry {
  public isAvailable = true
  public error: string = null
  public blockchain = 'ethereum'
  public url: string
  public isDev: boolean

  private _signer: ethers.ethers.Signer
  private _moduleInfoCache = new Map<string, Map<string, ModuleInfo[]>>()
  private _contract: ethers.ethers.Contract = null
  private _contractZoo: ethers.ethers.Contract = null
  private get _contractPromise(): Promise<ethers.ethers.Contract> {
    if (this._contract) {
      return Promise.resolve(this._contract)
    } else {
      return this._signer.resolveName(this.url).then((x) => {
        this._contract = new ethers.Contract(x, abi, this._signer)

        return this._contract
      })
    }
  }
  private async _init() {
    if (this._contractZoo) return

    const address = '0xdc3e16daa295e1e066283146d067040725cc5475'
    this._contractZoo = new ethers.Contract(address, abiZoo, this._signer)
  }

  constructor({ url, isDev, signer }: RegistryConfig) {
    if (!url) throw new Error('Endpoint Url is required')

    this.url = url
    this.isDev = isDev
    this._signer = signer
  }

  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getModuleInfo(
    contextIds: string[],
    listers: string[]
  ): Promise<{ [contextId: string]: ModuleInfo[] }> {
    if (!contextIds || contextIds.length === 0) return {}
    if (!listers || listers.length === 0) return {}

    try {
      listers = listers.filter(
        (x) => typeOfUri(x) === UriTypes.Ens || typeOfUri(x) === UriTypes.Ethereum
      )
      listers = await Promise.all(
        listers.map((u) =>
          typeOfUri(u) === UriTypes.Ens ? this._resolveEnsName(u) : Promise.resolve(u)
        )
      )
      listers = listers.filter((u) => u !== null)
      const usersCacheKey = listers.join(';')

      // ToDo: maybe it's overcached
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

      const contract = await this._contractPromise
      const { modules, owners }: { modules: EthModuleInfo[][]; owners: string[][] } =
        await contract.getModulesInfoByListersBatch(
          contextIds,
          listers,
          0 // ToDo: utilize paging (max buffer length)
        )
      this.isAvailable = true
      this.error = null

      const result = Object.fromEntries(
        modules.map((modules, i) => {
          const ctx = contextIds[i]
          const mis = modules.map((m, j) => this._convertFromEthMi({ ...m, owner: owners[i][j] }))

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
      console.error('Error in EthRegistry class when module info is fetching', err)
      throw err
    }
  }

  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getModuleInfoByName(name: string): Promise<ModuleInfo> {
    try {
      const contract = await this._contractPromise
      const { modules: module, owner } = await contract.getModuleInfoByName(name)
      const mi = this._convertFromEthMi({ ...module, owner })
      return mi
    } catch (err) {
      //console.error(err);
      return null
    }
  }

  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
    try {
      const contract = await this._contractPromise
      
      const versions = await this._paginateAll<EthVersionInfoDto>(
        (offset, limit) =>
          contract
            .getVersionsByModule(name, branch, offset, limit, true) // ordered by version desc
            .then(({ versions, total }) => ({ items: versions, total: total.toNumber() })),
        100
      )

      this.isAvailable = true
      this.error = null

      const result = versions.map((x) => this._convertFromEthVersion(x.version))
     
      return result
    } catch (err) {
      this.isAvailable = false
      this.error = err.message
      throw err
    }
  }

  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
    try {
      const contract = await this._contractPromise
      const response = await contract.getVersionInfo(
        name,
        branch,
        this._convertToEthVersion(version)
      )
      const vi = this._convertFromEthVi(response.dto, response.moduleType, { name, branch })
      this.isAvailable = true
      this.error = null
      return vi
    } catch (err) {
      // ToDo: is it necessary to return error here? how to return null from contract?
      if (err.reason === "Version doesn't exist") return null

      this.isAvailable = false
      this.error = err.message
      throw err
    }
  }

  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getAllDevModules({
    users,
  }: {
    users: string[]
  }): Promise<{ module: ModuleInfo; versions: VersionInfo[] }[]> {
    const contract = await this._contractPromise
    const result: { module: ModuleInfo; versions: VersionInfo[] }[][] = await Promise.all(
      users.map((account) =>
        this._paginateAll<{ module: ModuleInfo; versions: VersionInfo[] }>(
          (offset, limit) =>
            contract
              .getModulesByOwner(account, DEFAULT_BRANCH_NAME, offset, limit, true)
              .then((resp) => ({
                items: resp.modules.map((module, i) => ({
                  module: this._convertFromEthMi({ ...module, owner: account }),
                  versions: [
                    this._convertFromEthVi(resp.lastVersions[i], resp.modules[i].moduleType, {
                      name: resp.modules[i].name,
                      branch: resp.lastVersions[i].branch,
                    }),
                  ],
                })),
                total: resp.total.toNumber(),
              })),
          100
        )
      )
    )

    return mergeDedupe(result)
  }

  public async addModule(
    module: ModuleInfo,
    version: VersionInfo,
    reservationPeriod?
  ): Promise<void> {
    await this._init()
    const contract = await this._contractPromise
    const contractZoo = await this._contractZoo
    const isModuleExist = await contract
      .getModuleInfoByName(module.name)
      .then(() => true)
      .catch(() => false)

    if (isModuleExist && !version) throw new Error('A module with such name already exists.')

    if (!isModuleExist) {
     
      const mi = this._convertToEthMi(module)
      const vi = version ? this._convertToEthVi(version) : EMPTY_VERSION
    
      // add module in the end of a listing
      let links: LinkString[] = []

      // only dapplets will be added to a listing
      if (module.type === ModuleTypes.Feature) {
      
        const signerAddress = await this._signer.getAddress()
        const { modules: listedModules } = await contract.getModulesOfListing(
          signerAddress,
          DEFAULT_BRANCH_NAME,
          0,
          1,
          true
        ) // ordered by version desc
      
        if (listedModules.length === 0) {
          links = [
            {
              prev: 'H',
              next: module.name,
            },
            {
              prev: module.name,
              next: 'T',
            },
          ]
        } else {
          const lastModule = listedModules[0]
          links = [
            {
              prev: lastModule.name,
              next: module.name,
            },
            {
              prev: module.name,
              next: 'T',
            },
          ]
        }
      }

      const txCalcStake = await this.calcStake(reservationPeriod)
   
      const txAproove = await contractZoo.approve(
        '0x194a500Cbe0369Ad916E4CDc85572BF0810Ba676',
        txCalcStake
      )
      await txAproove.wait()
      const tx = await contract.addModuleInfo(module.contextIds, links, mi, vi, reservationPeriod)
      await tx.wait()
    } else {
      const vi = this._convertToEthVi(version)
      const tx = await contract.addModuleVersion(module.name, vi)
      await tx.wait()
    }
  }

  // ToDo: use getModuleInfoByName instead
  @Cacheable({ ttl: BLOCKTIME_MS })
  public async getOwnership(moduleName: string) {
    try {
      const contract = await this._contractPromise
      const mi = await contract.getModuleInfoByName(moduleName)
      return mi.owner
    } catch {
      return null
    }
  }

  public async transferOwnership(moduleName: string, newAccount: string, oldAccount: string) {
    const contract = await this._contractPromise
    const moduleIdx = await contract.getModuleIndex(moduleName)
    const nftAddress = await contract.getNftContractAddress()
    const nftContract = new ethers.Contract(nftAddress, nftAbi, this._signer)
    const tx = await nftContract.transferFrom(oldAccount, newAccount, moduleIdx)
    await tx.wait()
  }

  public async getContextIds(moduleName: string): Promise<string[]> {
    const contract = await this._contractPromise
    return contract.getContextIdsByModule(moduleName)
  }
  public async getStakeStatus(appId: string): Promise<string> {
    const contract = await this._contractPromise
    return contract.getStakeStatus(appId)
  }
  public async stakingToken(): Promise<string>{
    const contract = await this._contractPromise
    return contract.stakingToken()
  }
  public async burnShare(): Promise<number> {
    const contract = await this._contractPromise
    const percent = ethers.utils.formatUnits(await contract.burnShare(), 16)
    return parseInt(percent)
  };

  public async calcExtendedStake(appId: string, secondsDuration: number): Promise<number> {
    const contract = await this._contractPromise

    const parseStakeCalcExt = ethers.utils.formatUnits(
      await contract.calcExtendedStake(appId, secondsDuration),
      16
    )

    return parseInt(parseStakeCalcExt)
  }

  public async calcStake(duration: number): Promise<number> {
    const contract = await this._contractPromise

    const parseStakeCalc = ethers.utils.formatUnits(await contract.calcStake(duration), 16)

    return parseInt(parseStakeCalc)
  }
  public async stakes(appId: string, parameters): Promise<number> {
    const contract = await this._contractPromise
    if (parameters === 'date') {
      const dateAt = await contract.stakes(appId)

      const parseStakes = convertTimestampToISODate((await dateAt[2].toNumber()) * 1000)
      let date = new Date(parseStakes)
      let nowDate = new Date()
      var daysLag = Math.ceil(Math.abs(date.getTime() - nowDate.getTime()) / (1000 * 3600 * 24))

      return daysLag
    } else if ('amount') {
      const amount = await contract.stakes(appId)

      const parseStakes = ethers.utils.formatUnits(await amount[0], 16)

      return parseInt(parseStakes)
    }
  }
  public async burnDUC(moduleName: string) {
    const contract = await this._contractPromise
  
    const tx = await contract.burnDUC(moduleName)
    await tx.wait()
    EventBus.emit('burned')
  }
  public async extendReservation(moduleName: string, reservationPeriod: number) {
    await this._init()
    const contract = await this._contractPromise
    const contractZoo = await this._contractZoo
    const txCalcStake = await this.calcStake(reservationPeriod)
    const txAproove = await contractZoo.approve(
      '0x194a500Cbe0369Ad916E4CDc85572BF0810Ba676',
      txCalcStake
    )
    await txAproove.wait()

    const tx = await contract.extendReservation(moduleName, reservationPeriod)
    await tx.wait()
  }

  public async addContextId(moduleName: string, contextId: string) {
    const contract = await this._contractPromise
    const tx = await contract.addContextId(moduleName, contextId)
    await tx.wait()
  }

  public async removeContextId(moduleName: string, contextId: string) {
    const contract = await this._contractPromise
    const tx = await contract.removeContextId(moduleName, contextId)
    await tx.wait()
  }

  public async getAdmins(moduleName: string): Promise<string[]> {
    const contract = await this._contractPromise
    return contract.getAdminsByModule(moduleName)
  }

  public async addAdmin(moduleName: string, adressAdmin: string) {
    const contract = await this._contractPromise
    const tx = await contract.addAdmin(moduleName, adressAdmin)
    await tx.wait()
  }

  public async removeAdmin(moduleName: string, adressAdmin: string) {
    const contract = await this._contractPromise
    const tx = await contract.removeAdmin(moduleName, adressAdmin)
    await tx.wait()
  }

  public async editModuleInfo(module: ModuleInfo): Promise<void> {
    const contract = await this._contractPromise
    const ethMi = this._convertToEthMi(module)
    await contract.editModuleInfo(
      ethMi.name,
      ethMi.title,
      ethMi.description,
      ethMi.image,
      ethMi.manifest,
      ethMi.icon
    )
  }

  public async getModuleNftUrl(moduleName: string): Promise<string> {
    const contract = await this._contractPromise
    const [moduleIdx, nftAddress, chainId] = await Promise.all([
      contract.getModuleIndex(moduleName),
      contract.getNftContractAddress(),
      this._signer.getChainId(),
    ])
    const network = networkName(chainId)
    const nftUrl = `https://testnets.opensea.io/assets/${network}/${nftAddress}/${moduleIdx}`
    return nftUrl
  }

  private _convertFromEthMi(m: EthModuleInfo): ModuleInfo {
    const mi = new ModuleInfo()
    mi.type = moduleTypesMap[m.moduleType]
    mi.name = m.name
    mi.title = m.title
    mi.description = m.description
    mi.author = m.owner
    mi.image = this._convertFromEthStorageRef(m.image)
    mi.metadata = this._convertFromEthStorageRef(m.manifest)
    mi.icon = this._convertFromEthStorageRef(m.icon)
    mi.interfaces = m.interfaces
    mi.registryUrl = this.url
    mi.isUnderConstruction = getBitFromHex(m.flags.toHexString(), 0)
    return mi
  }

  private _convertFromEthVi(
    dto: EthVersionInfoDto,
    moduleType: number,
    { name, branch }: { name: string; branch: string }
  ): VersionInfo {
    const vi = new VersionInfo()
    vi.registryUrl = this.url
    vi.name = name
    vi.branch = branch
    vi.version = this._convertFromEthVersion(dto.version)
    vi.type = moduleTypesMap[moduleType]
    vi.dist = this._convertFromEthStorageRef(dto.binary)
    vi.dependencies = Object.fromEntries(
      dto.dependencies.map((d) => [d.name, this._convertFromEthVersion(d.version)])
    )
    vi.interfaces = Object.fromEntries(
      dto.interfaces.map((d) => [d.name, this._convertFromEthVersion(d.version)])
    )
    vi.extensionVersion = this._convertFromEthVersion(dto.extensionVersion)
    vi.createdAt = convertTimestampToISODate(dto.createdAt.toNumber() * 1000)
    return vi
  }

  private _convertToEthMi(module: ModuleInfo): EthModuleInfo {
    return {
      name: module.name,
      moduleType: parseInt(Object.entries(moduleTypesMap).find(([, v]) => v === module.type)[0]),
      flags: ethers.BigNumber.from('0x00'),
      title: module.title,
      image: module.image ?? EMPTY_STORAGE_REF,
      description: module.description,
      manifest: module.metadata ?? EMPTY_STORAGE_REF,
      icon: module.icon ?? EMPTY_STORAGE_REF,
      owner: ZERO_ADDRESS,
      interfaces: module.interfaces || [],
    }
  }

  private _convertToEthVi(version: VersionInfo): EthVersionInfoDto {
    const convertDependencies = (dependencies: { [name: string]: string }): EthDependencyDto[] => {
      return (
        (dependencies &&
          Object.entries(dependencies).map(([k, v]) => ({
            name: k,
            branch: 'default',
            version: this._convertToEthVersion(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME]),
          }))) ||
        []
      )
    }

    return {
      branch: version.branch,
      version: this._convertToEthVersion(version.version),
      binary: version.dist ?? EMPTY_STORAGE_REF,
      dependencies: convertDependencies(version.dependencies),
      interfaces: convertDependencies(version.interfaces),
      flags: 0,
      extensionVersion: this._convertToEthVersion(version.extensionVersion),
      createdAt: ethers.BigNumber.from(convertISODateToTimestamp(version.createdAt)),
    }
  }

  private _convertFromEthVersion(hex: string): string {
    if (hex.length != 10) throw new Error('Invalid hex of version')
    const major = parseInt(hex.substr(2, 2), 16)
    const minor = parseInt(hex.substr(4, 2), 16)
    const patch = parseInt(hex.substr(6, 2), 16)
    const pre = parseInt(hex.substr(8, 2), 16)
    return `${major}.${minor}.${patch}` + (pre !== 255 ? `-pre.${pre}` : '')
  }

  private _convertToEthVersion(version: string): string {
    if (!version) return '0x000000ff'

    const toTwoDigits = (n: string) => {
      return n.length < 2 ? '0' + n : n.length > 2 ? 'ff' : n
    }

    return (
      '0x' +
      toTwoDigits(semver.major(version).toString(16)) +
      toTwoDigits(semver.minor(version).toString(16)) +
      toTwoDigits(semver.patch(version).toString(16)) +
      toTwoDigits(semver.prerelease(version)?.[1].toString(16) ?? 'ff')
    )
  }

  private _convertFromEthStorageRef(storageRef: EthStorageRef): StorageRef {
    return storageRef.hash === ZERO_BYTES32
      ? null
      : {
          hash: storageRef.hash,
          uris: storageRef.uris,
        }
  }

  private async _paginateAll<T>(
    callback: (offset: number, limit: number) => Promise<{ items: T[]; total: number }>,
    pageSize
  ) {
    const out: T[] = []
    let total = null

    for (let i = 0; total === null || i < total; i = i + pageSize) {
      const { items, total: _total } = await callback(i, pageSize)
      out.push(...items)
      total = _total
    }

    return out
  }

  @Cacheable()
  private async _resolveEnsName(name: string): Promise<string> {
    return this._signer.resolveName(name)
  }
}
