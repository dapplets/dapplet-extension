import { compare, rcompare } from 'semver'
import { ModuleTypes } from '../../common/constants'
import {
  allSettled,
  assertFullfilled,
  assertRejected,
  mergeDedupe,
  typeOfUri,
  UriTypes,
} from '../../common/helpers'
import { ChainTypes, DefaultSigners, Environments } from '../../common/types'
import VersionInfoBrowserStorage from '../browserStorages/versionInfoStorage'
import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'
import { DevRegistry } from '../registries/devRegistry'
import { EthRegistry } from '../registries/ethRegistry'
import { NearRegistry } from '../registries/nearRegistry'
import { Registry } from '../registries/registry'
import GlobalConfigService from '../services/globalConfigService'
import { WalletService } from '../services/walletService'

if (!Promise.allSettled) Promise.allSettled = allSettled

export class RegistryAggregatorService {
  public isAvailable = true
  public registries: Registry[] = []

  private _versionInfoStorage = new VersionInfoBrowserStorage()
  private _initializationPromise = null

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService
  ) {}

  async getVersions(name: string, branch: string, isDev?: boolean): Promise<string[]> {
    await this._initRegistries()
    const registries = this.registries.filter((x) =>
      isDev === undefined ? true : x.isDev === isDev
    )

    if (registries.length === 0) return []

    const versionsWithErrors = await Promise.allSettled(
      registries.map((r) => r.getVersionNumbers(name, branch))
    )
    versionsWithErrors.filter(assertRejected).forEach((p) => console.error(p.reason))
    const versionsNoErrors = versionsWithErrors.filter(assertFullfilled).map((p) => p.value)
    const versionsNotSorted = mergeDedupe(versionsNoErrors)
    const versionsAsc = versionsNotSorted.sort(compare) // ASC sorting by semver

    return versionsAsc
  }

  async getLastVersion(name: string, branch: string, isDev?: boolean): Promise<string | null> {
    const versions = await this.getVersions(name, branch, isDev)
    if (versions.length === 0) return null
    return versions.sort(rcompare)[0]
  }

  async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
    await this._initRegistries()
    const registries = this.registries

    const uriWithErrors = await Promise.allSettled(
      registries.map((r) => {
        const promise = r.isDev
          ? r.getVersionInfo(name, branch, version)
          : this._cacheVersionInfo(r, name, branch, version)

        return promise.then((vi) => {
          if (!vi) return null
          vi.environment = r.isDev ? Environments.Dev : Environments.Test
          return vi
        })
      })
    )

    const uriNoErrors = uriWithErrors
      .filter(assertFullfilled)
      .map((p) => p.value)
      .filter((v) => v !== null)
    const uriErrors = uriWithErrors.filter(assertRejected)

    if (uriNoErrors.length === 0) {
      uriErrors.forEach((p) => console.error(p.reason))
      console.error(`Could not find the manifest URI of the ${name}#${branch}@${version} module`)
      return null
    }

    const vi = uriNoErrors[0]

    if (!vi) {
      return null
    }

    if (vi.name !== name || vi.version !== version || vi.branch !== branch) {
      console.error(
        `Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${vi.name}#${vi.branch}@${vi.version}.`
      )
      return null
    }

    return vi
  }

  public async getModuleInfoWithRegistries(
    contextIds: string[],
    users: string[]
  ): Promise<{ [registryUrl: string]: { [hostname: string]: ModuleInfo[] } }> {
    await this._initRegistries()
    const registries = this.registries

    const regFeatures = await Promise.allSettled(
      registries.map((r) => r.getModuleInfo(contextIds, users).then((m) => [r.url, m]))
    )
    regFeatures.filter(assertRejected).forEach((p) => console.error(p.reason))
    const validRegFeatures = regFeatures.filter(assertFullfilled).map((p) => p.value)
    const merged = Object.fromEntries(validRegFeatures)

    // Below is some magic, which finds modules by names and interfaces in another registries.
    // For example:
    // 1) An interface, linked with some context ID, is in the registry A.
    // 2) An adapter, implementing the interface, is in the registry A.
    // 3) An feature, using this adapter, is in the registry B.
    // 4) Without this magic, the feature will not be found by the context ID, with which the interface is linked.

    const additionalContextIds = validRegFeatures.map(([k, v]) => [
      k,
      Object.entries(v)
        .map(([k2, v2]) => [k2, mergeDedupe(v2.map((x) => [x.name, ...x.interfaces]))])
        .filter((x) => x[1].length !== 0),
    ]) as [string, [string, string[]][]][]
    const mergedModuleInfos = Object.values(merged)
      .map((x) => Object.values(x).reduce((a, b) => a.concat(b), []))
      .reduce((a, b) => a.concat(b), [])
    for (const [, contexts] of additionalContextIds) {
      for (const context of contexts) {
        context[1] = context[1].filter(
          (c) => mergedModuleInfos.find((x) => x.name === c)?.type !== ModuleTypes.Feature
        )
      }
    }
    const promiseResults = await Promise.allSettled(
      additionalContextIds.map(([registryUrl, ctxIds2]) =>
        Promise.allSettled(
          ctxIds2.map(([oldCtxId, newCtxIds]) =>
            Promise.allSettled(
              registries
                .filter((r) => r.url !== registryUrl)
                .map((r) =>
                  r
                    .getModuleInfo(newCtxIds, users)
                    .then((res) => [
                      r.url,
                      oldCtxId,
                      mergeDedupe(Object.entries(res).map((x) => x[1])),
                    ])
                )
            )
          )
        )
      )
    )
    const promiseValues = mergeDedupe(
      promiseResults
        .filter(assertFullfilled)
        .map((x) =>
          mergeDedupe(
            x.value
              .filter(assertFullfilled)
              .map((y) => y.value.filter(assertFullfilled).map((z) => z.value))
          )
        )
    ) as [string, string, ModuleInfo[]][]
    promiseValues.forEach(([regUrl, contextId, modules]) => {
      if (!merged[regUrl]) merged[regUrl] = {}
      if (!merged[regUrl][contextId]) merged[regUrl][contextId] = []
      merged[regUrl][contextId].push(...modules)
    })

    return merged
  }

  public async getAllDevModules({
    users,
  }: {
    users: { name: string; blockchain: string }[]
  }): Promise<{ module: ModuleInfo; versions: VersionInfo[]; isDeployed?: boolean[] }[]> {
    await this._initRegistries()
    const registries = this.registries

    // fetch all dev modules
    const modules = await Promise.allSettled(
      registries.map((r) => {
        const addresses = users
          .filter((user) => user.blockchain === r.blockchain && !!user.name) // ToDo: We need to know the chain of the registry. Is there another way to get it?
          .map((user) => user.name)
        const uniqAdresses = [...new Set(addresses)]
        return r.getAllDevModules({ users: uniqAdresses })
      })
    )
    modules.filter(assertRejected).forEach((p) => console.error(p.reason))
    const validModules = modules.filter(assertFullfilled).map((p) => p.value)
    const reduced = validModules.length > 0 ? validModules.reduce((a, b) => a.concat(b)) : []

    // check deployment in prod registries
    const prodRegistries = registries.filter((r) => !r.isDev)

    let devModules: { module: ModuleInfo; versions: VersionInfo[]; isDeployed?: boolean[] }[] = []

    if (prodRegistries.length === 0) {
      devModules = reduced.map((x) => ({ ...x, isDeployed: [] }))
    } else {
      // ToDo: optimize amount of external requests
      const vis = await Promise.all(
        reduced.map((m) =>
          m.versions[0]
            ? prodRegistries[0]
                .getVersionInfo(m.module.name, m.versions[0].branch, m.versions[0].version)
                .catch(() => null)
            : Promise.resolve(true)
        )
      )
      devModules = reduced.map((x, i) => ({ ...x, isDeployed: [!!vis[i]] }))
    }

    return devModules
  }

  public async getRegistryByUri(uri: string): Promise<Registry> {
    await this._initRegistries()
    return this.registries.find((f) => f.url === uri)
  }

  private async _initRegistries() {
    // prevent multiple initializations of registries
    if (!this._initializationPromise) {
      this._initializationPromise = this.__initRegistries().then(
        () => (this._initializationPromise = null)
      )
    }

    return this._initializationPromise
  }

  private async __initRegistries() {
    // ToDo: fetch LocalConfig
    const configuredRegistries = await this._globalConfigService.getRegistries()
    const isDevMode = await this._globalConfigService.getDevMode()

    const enabledRegistries = configuredRegistries
      .filter((x) => x.isEnabled) // only enabled
      .filter((x) => (isDevMode ? true : !x.isDev)) // dev registries are instanced only when dev mode is activated

    // delete disabled registries
    this.registries = this.registries.filter((x) => enabledRegistries.find((y) => y.url === x.url))

    // initialize missing registries
    for (const registryConfig of enabledRegistries) {
      if (this.registries.find((x) => x.url === registryConfig.url)) continue

      const registry = await this._instantiateRegistry(registryConfig)

      if (registryConfig) {
        this.registries.push(registry)
      } else {
        console.error('Invalid registry URL: ' + registryConfig.url)
      }
    }

    // dev registries have priority
    this.registries = this.registries.sort((a, b) => (a.isDev === b.isDev ? 0 : a.isDev ? -1 : 1))
  }

  private async _cacheVersionInfo(
    registry: Registry,
    name: string,
    branch: string,
    version: string
  ) {
    const cachedVi = await this._versionInfoStorage.get(registry.url, name, branch, version)
    if (cachedVi) return cachedVi

    const vi = await registry.getVersionInfo(name, branch, version)
    if (!vi) return null

    await this._versionInfoStorage.create(vi)
    return vi
  }

  private async _instantiateRegistry(registryConfig: {
    isEnabled: boolean
    url: string
    isDev: boolean
  }): Promise<Registry | null> {
    const uriType = typeOfUri(registryConfig.url)

    if (uriType === UriTypes.Http && registryConfig.isDev) {
      return new DevRegistry({ url: registryConfig.url, isDev: registryConfig.isDev })
    } else if (uriType === UriTypes.Ethereum || uriType === UriTypes.Ens) {
      const ethSigner = await this._walletService.eth_getSignerFor(
        DefaultSigners.EXTENSION,
        ChainTypes.ETHEREUM_SEPOLIA
      )
      return new EthRegistry({
        url: registryConfig.url,
        isDev: registryConfig.isDev,
        signer: ethSigner,
      })
    } else if (uriType === UriTypes.Near) {
      const nearAccount = await this._walletService.near_getAccount(
        DefaultSigners.EXTENSION,
        ChainTypes.NEAR_TESTNET
      )
      return new NearRegistry({ url: registryConfig.url, isDev: registryConfig.isDev, nearAccount })
    } else {
      return null
    }
  }
}
