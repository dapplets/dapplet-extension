import { Cacheable } from 'caching-decorator'
import JSZip from 'jszip'
import { maxSatisfying } from 'semver'
import { TopologicalSort } from 'topological-sort'
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants'
import { areModulesEqual, joinUrls } from '../../common/helpers'
import { NotificationType } from '../../common/models/notification'
import { DefaultConfig, SchemaConfig, StorageRef } from '../../common/types'
import { ParserConfig } from '../../contentscript/modules/config-adapter/types'
import VersionInfo from '../models/versionInfo'
import { StorageAggregator } from '../moduleStorages/moduleStorage'
import { RegistryAggregator } from '../registries/registryAggregator'
import GlobalConfigService from '../services/globalConfigService'
import { NotificationService } from '../services/notificationService'
import { WalletService } from '../services/walletService'

export default class ModuleManager {
  public registryAggregator: RegistryAggregator

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService,
    private _notificationService: NotificationService,
    private _storage: StorageAggregator
  ) {
    this.registryAggregator = new RegistryAggregator(this._globalConfigService, this._walletService)
  }

  public async resolveDependencies(
    modules: {
      name: string
      version?: string
      branch?: string
      contextIds: string[]
    }[]
  ) {
    // ToDo: Add dependency optimizer
    // Search for the following topics:
    // 1. Topological Sorting
    // 2. Dependency Resolution Algorithm

    let dependencies: {
      name: string
      branch: string
      version: string
      contextIds: string[]
      manifest: VersionInfo
    }[] = modules.map(({ name, version, branch, contextIds }) => ({
      name,
      version,
      branch: !branch ? DEFAULT_BRANCH_NAME : branch,
      contextIds,
      manifest: null,
    }))

    const resolve = async (parent: {
      name: string
      branch: string | null
      version: string | null
      contextIds: string[]
      manifest: VersionInfo
    }) => {
      try {
        const depsAndManifest = await this._getOptimizedChildDependenciesAndManifest({
          name: parent.name,
          version: parent.version,
          branch: parent.branch,
          contextIds: parent.contextIds,
        })

        if (!depsAndManifest) return

        parent.manifest = depsAndManifest.manifest

        for (const dep of depsAndManifest.dependencies) {
          if (!dependencies.find((d) => areModulesEqual(d, dep))) {
            const depToPush = { ...dep, manifest: null, contextIds: parent.contextIds }
            dependencies.push(depToPush)
            await resolve(depToPush)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }

    await Promise.all(dependencies.map((d) => resolve(d)))

    dependencies
      .filter((d) => !d.manifest)
      .forEach((x) =>
        console.log(`[DAPPLETS]: Loading of module ${x.name}#${x.branch}@${x.version} was skipped`)
      )
    dependencies = dependencies.filter((d) => !!d.manifest)

    // Interfaces to implementations map
    const impl = new Map<string, string>()
    dependencies.forEach((d) =>
      Object.keys(d.manifest.interfaces || {}).forEach((i) => impl.set(i, d.name))
    )

    // Topological sorting
    const nodes = new Map<string, any>()
    dependencies.forEach((d) => nodes.set(d.name, d))
    const sorting = new TopologicalSort(nodes)
    dependencies.forEach((d) =>
      Object.keys(d.manifest.dependencies || {}).forEach((dd) =>
        sorting.addEdge(d.name, impl.get(dd) || dd)
      )
    )
    const sorted = sorting.sort()
    const keys = [...sorted.keys()]

    // reverse() - the lowest script in the hierarchy should be loaded first
    return (
      keys
        .map((k) => dependencies.find((d) => d.name === k))
        // .reverse() // ToDo: check why reverse() returns incorrect order
        .filter((d) => !!d.manifest)
    )
  }

  private async _loadScriptOrConfig(url: StorageRef) {
    const resource = await this._storage.getResource(url)
    const scriptOrConfig = new TextDecoder('utf-8').decode(new Uint8Array(resource))
    return scriptOrConfig
  }

  private async _loadJson(url: StorageRef) {
    const resource = await this._storage.getResource(url)
    const json = new TextDecoder('utf-8').decode(new Uint8Array(resource))
    const object = JSON.parse(json)
    return object
  }

  private async _loadDist(
    url: StorageRef,
    moduleType: ModuleTypes
  ): Promise<{
    scriptOrConfig: string | ParserConfig
    defaultConfig: DefaultConfig
    schemaConfig: SchemaConfig
    internalManifest: any
  }> {
    const resource = await this._storage.getResource(url)
    const jszip = new JSZip()
    const zip = await jszip.loadAsync(resource)

    let scriptOrConfig: string | ParserConfig
    if (moduleType === ModuleTypes.ParserConfig) {
      const configAsStr = await zip.file('index.json').async('string')
      const config: ParserConfig = JSON.parse(configAsStr)
      const callback = async (value) => zip.file(value).async('string')
      scriptOrConfig = await this._deepReplaceByKey(callback, config, 'styles')
    } else {
      scriptOrConfig = await zip.file('index.js').async('string')
    }
    const defaultJson = zip.file('default.json') && (await zip.file('default.json').async('string'))
    const schemaJson = zip.file('schema.json') && (await zip.file('schema.json').async('string'))
    const internalManifestJson =
      zip.file('dapplet.json') && (await zip.file('dapplet.json').async('string'))

    return {
      scriptOrConfig,
      defaultConfig: defaultJson && JSON.parse(defaultJson),
      schemaConfig: schemaJson && JSON.parse(schemaJson),
      internalManifest: internalManifestJson && JSON.parse(internalManifestJson),
    }
  }

  public async loadModule(m: VersionInfo): Promise<{
    scriptOrConfig: string | ParserConfig
    defaultConfig: DefaultConfig
    schemaConfig: SchemaConfig
    internalManifest: any
  }> {
    if (m.dist) {
      // from decentralized registry
      return this._loadDist(m.dist, m.type)
    } else {
      // from developer registry
      let scriptOrConfig: string | ParserConfig = await this._loadScriptOrConfig(m.main)
      if (m.type === ModuleTypes.ParserConfig) {
        const config: ParserConfig = JSON.parse(scriptOrConfig)
        const callback = async (value) => (await fetch(joinUrls(m.main.uris[0], value))).text()
        scriptOrConfig = await this._deepReplaceByKey(callback, config, 'styles')
      }
      const defaultConfig =
        m.defaultConfig && (await this._loadJson(m.defaultConfig).catch(() => null))
      const schemaConfig =
        m.schemaConfig && (await this._loadJson(m.schemaConfig).catch(() => null))
      return { scriptOrConfig, defaultConfig, schemaConfig, internalManifest: null }
    }
  }

  @Cacheable()
  private async _getOptimizedChildDependenciesAndManifest(module: {
    name: string
    version: string | null
    branch: string | null
    contextIds: string[]
  }) {
    const moduleDeps = await this._getChildDependenciesAndManifest(module)

    if (!moduleDeps) return
    if (!moduleDeps.manifest || !moduleDeps.dependencies) return

    const optimizedDeps = await Promise.all(
      moduleDeps.dependencies.map((d) =>
        this.optimizeDependency(d.name, d.version, d.branch, module.contextIds)
      )
    )

    return { dependencies: optimizedDeps, manifest: moduleDeps.manifest }
  }

  //ToDo: rework the _getChildDependencies and move it into ContentScript
  private async _getChildDependenciesAndManifest(module: {
    name: string
    version: string | null
    branch: string | null
    contextIds: string[]
  }) {
    if (!module.branch) {
      module.branch = DEFAULT_BRANCH_NAME
    }

    if (!module.version || module.version === 'latest') {
      const version = await this.registryAggregator.getLastVersion(module.name, module.branch)
      if (!version) return null
      module.version = version
      console.log(
        `Version for module "${module.name}#${module.branch}" is not specified. The latest version ${module.version} is selected.`
      )
    }

    let vi = await this.registryAggregator.getVersionInfo(
      module.name,
      module.branch,
      module.version
    )
    if (!vi) return null

    if (vi.type === ModuleTypes.Interface) {
      vi = await this._findImplementation(
        module.name,
        module.branch,
        module.version,
        module.contextIds
      )
      if (vi) {
        console.log(
          `[DAPPLETS]: Found implementation for ${module.name}#${module.branch}@${module.version} interface: ${vi.name}`
        )
      } else {
        console.error(`An implementation of the interface ${module.name} is not found.`)
        return { manifest: vi, dependencies: [] }
      }
    }

    if (!vi.dependencies) return { manifest: vi, dependencies: [] }

    const dependencies: { name: string; branch: string; version: string }[] = []

    Object.getOwnPropertyNames(vi.dependencies).forEach((name) => {
      const dependency = vi.dependencies[name]

      if (typeof dependency === 'string') {
        // only version is specified
        dependencies.push({
          name: name,
          branch: DEFAULT_BRANCH_NAME,
          version: dependency,
        })
      } else if (typeof dependency === 'object') {
        // branch is specified
        if (!dependency[DEFAULT_BRANCH_NAME]) {
          console.error(`Default branch version is not specified.`)
          return
        }

        dependencies.push({
          name: name,
          branch: DEFAULT_BRANCH_NAME,
          version: dependency[DEFAULT_BRANCH_NAME],
        })
      } else {
        console.error(`Invalid dependencies in manifest.`)
      }
    })

    return { manifest: vi, dependencies }
  }

  public async optimizeDependency(
    name: string,
    version: string,
    branch: string = DEFAULT_BRANCH_NAME,
    contextIds: string[]
  ): Promise<{ name: string; version: string; branch: string }> {
    // ToDo: Fetch prefix from global settings.
    // ToDo: Replace '>=' to '^'
    const prefix = '>=' // https://devhints.io/semver
    const range = prefix + version
    const allVersions = await this.registryAggregator.getVersions(name, branch)

    if (allVersions.length === 0) {
      throw new Error(`The module ${name}#${branch} doesn't have any versions.`)
    }

    const optimizedVersion = maxSatisfying(allVersions, range)

    // ToDo: catch null in optimizedVersion

    if (version != optimizedVersion) {
      this._notificationService.createNotification({
        title: 'Dependency Optimizer',
        type: NotificationType.System,
        message: `Package "${name}#${branch}" version has been upgraded from ${version} to ${optimizedVersion}.`,
      })
    }

    return {
      name: name,
      branch: branch,
      version: optimizedVersion,
    }
  }

  private async _findImplementation(
    name: string,
    branch: string,
    version: string,
    contextIds: string[]
  ): Promise<VersionInfo> {
    const users = await this._globalConfigService
      .getTrustedUsers()
      .then((u) => u.map((a) => a.account))

    // ToDo: optimize interface implementation lookup when the function is added to the registry
    const modules = await this.registryAggregator.getModuleInfoWithRegistries(contextIds, users)

    for (const registry in modules) {
      for (const hostname in modules[registry]) {
        for (const mi of modules[registry][hostname]) {
          if (mi.interfaces && mi.interfaces.indexOf(name) !== -1) {
            const version = await this.registryAggregator.getLastVersion(
              mi.name,
              DEFAULT_BRANCH_NAME
            ) // ToDo: fix it
            const vi = await this.registryAggregator.getVersionInfo(
              mi.name,
              DEFAULT_BRANCH_NAME,
              version
            )
            return vi
          }
        }
      }
    }

    return null
  }

  private async _deepReplaceByKey(callback: any, data: any, keyToReplace: string) {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(data).map(async ([key, value]: [string, any]) => [
          key,
          key === keyToReplace
            ? await callback(value)
            : typeof value === 'object'
            ? await this._deepReplaceByKey(callback, value, keyToReplace)
            : value,
        ])
      )
    )
  }
}
