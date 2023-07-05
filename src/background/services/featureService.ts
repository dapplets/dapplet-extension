import JSZip from 'jszip'
import { rcompare } from 'semver'
import { base64ArrayBuffer } from '../../common/base64ArrayBuffer'
import {
  CONTEXT_ID_WILDCARD,
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../common/constants'
import * as EventBus from '../../common/global-event-bus'
import {
  areModulesEqual,
  getCurrentTab,
  joinUrls,
  Measure,
  mergeDedupe,
  parseModuleName,
} from '../../common/helpers'
import ManifestDTO from '../dto/manifestDTO'
import ModuleInfo from '../models/moduleInfo'
import VersionInfo from '../models/versionInfo'
import { StorageAggregator } from '../moduleStorages/moduleStorage'
// import ModuleInfoBrowserStorage from '../browserStorages/moduleInfoStorage';
import { globalClear } from 'caching-decorator'
import browser, { Runtime } from 'webextension-polyfill'
import { DappletRuntimeResult, MessageWrapperRequest, StorageRef } from '../../common/types'
import ModuleManager from '../utils/moduleManager'
import { AnalyticsGoals, AnalyticsService } from './analyticsService'
import GlobalConfigService from './globalConfigService'
import { NotificationService } from './notificationService'
import { generateNftImage } from './offscreenService'
import { WalletService } from './walletService'

export default class FeatureService {
  private _moduleManager: ModuleManager
  private _storageAggregator = new StorageAggregator(this._globalConfigService)
  // private _moduleInfoBrowserStorage = new ModuleInfoBrowserStorage();

  // private _requestId = 0

  constructor(
    private _globalConfigService: GlobalConfigService,
    private _walletService: WalletService,
    private _notificationService: NotificationService,
    private _analyticsService: AnalyticsService
  ) {
    this._moduleManager = new ModuleManager(
      this._globalConfigService,
      this._walletService,
      this._notificationService,
      this._storageAggregator
    )
  }

  /**
   * Returns ModuleInfos wrapped to ManifestDTO by given context IDs and filter
   * @param contextIds array of context IDs
   * @param filter all - no filters, public - listings of connected wallets,
   *               trusted - listings of trusted users, local - local listing
   * @returns Array of ManifestDTOs
   */
  async getFeaturesByHostnames(
    contextIds: string[],
    filter: 'all' | 'public' | 'trusted' | 'local' | 'active' | null
  ): Promise<ManifestDTO[]> {
    if (!filter) filter = 'all'

    // const requestId = this._requestId++
    // const startTime = Date.now()
    // console.log(`getFeaturesByHostnames called #${requestId}`)

    const listingAccounts: string[] = []

    if (filter === 'all' || filter === 'trusted') {
      const trustedUsers = await this._globalConfigService.getTrustedUsers()
      const accounts = trustedUsers.map((u) => u.account).filter((x) => !!x)
      listingAccounts.push(...accounts)
    }

    if (filter === 'all' || filter === 'public') {
      const walletDescriptors = await this._walletService.getWalletDescriptors()
      const accounts = walletDescriptors
        .filter((x) => x.connected)
        .map((x) => x.account)
        .filter((x) => !!x)
      listingAccounts.push(...accounts)
    }

    if (filter === 'active') {
      const trustedUsers = await this._globalConfigService.getTrustedUsers()
      const accounts = trustedUsers.map((u) => u.account).filter((x) => !!x)
      listingAccounts.push(...accounts)
    }

    const contextIdsByRegsitries =
      await this._moduleManager.registryAggregator.getModuleInfoWithRegistries(
        contextIds,
        listingAccounts
      )
    const dtos: ManifestDTO[] = []

    const configRegistries = await this._globalConfigService.getRegistries()
    const everywhereConfig = await this._globalConfigService.getSiteConfigById(CONTEXT_ID_WILDCARD)

    let i = 0

    // ToDo: how to merge modules from different registries???
    for (const [registryUrl, moduleInfosByContextId] of Object.entries(contextIdsByRegsitries)) {
      for (const [contextId, moduleInfos] of Object.entries(moduleInfosByContextId)) {
        for (const moduleInfo of moduleInfos) {
          const dto = dtos.find((d) => d.name === moduleInfo.name)
          if (!dto) {
            const dto: ManifestDTO = moduleInfo as any
            const config = await this._globalConfigService.getSiteConfigById(contextId) // ToDo: which contextId should we compare?
            dto.isActive =
              config.activeFeatures[dto.name]?.isActive ||
              everywhereConfig.activeFeatures[dto.name]?.isActive ||
              false
            dto.isActionHandler =
              config.activeFeatures[dto.name]?.runtime?.isActionHandler ||
              everywhereConfig.activeFeatures[dto.name]?.runtime?.isActionHandler ||
              false
            dto.isHomeHandler =
              config.activeFeatures[dto.name]?.runtime?.isHomeHandler ||
              everywhereConfig.activeFeatures[dto.name]?.runtime?.isHomeHandler ||
              false
            dto.activeVersion = dto.isActive
              ? config.activeFeatures[dto.name]?.version ||
                everywhereConfig.activeFeatures[dto.name]?.version ||
                null
              : null
            dto.lastVersion = dto.isActive
              ? await this.getVersions(registryUrl, dto.name).then((x) => x.sort(rcompare)[0])
              : null // ToDo: how does this affect performance?
            dto.order = i++
            dto.sourceRegistry = {
              url: registryUrl,
              isDev: configRegistries.find((r) => r.url === registryUrl).isDev,
            }
            if (!dto.hostnames) dto.hostnames = []
            dto.hostnames = mergeDedupe([dto.hostnames, [contextId]])
            dto.available = true
            dto.isMyDapplet = false
            if (filter === 'active') {
              dto.isActive && dtos.push(dto)
            } else {
              dtos.push(dto)
            }
          } else {
            // ToDo: move this merging logic to aggragator
            if (!dto.hostnames) dto.hostnames = []
            dto.hostnames = mergeDedupe([dto.hostnames, [contextId]])
          }
        }
      }
    }

    const activeRegistries = configRegistries.filter((x) => x.isEnabled)

    // Adding of unavailable dapplets
    for (const contextId of contextIds) {
      const config = await this._globalConfigService.getSiteConfigById(contextId)
      for (const moduleName in config.activeFeatures) {
        const registryUrl = config.activeFeatures[moduleName].registryUrl
        if (!activeRegistries.find((r) => r.url === registryUrl)) continue
        if (dtos.find((x) => x.name === moduleName)) continue

        const moduleInfo = await this.getModuleInfoByName(registryUrl, moduleName)
        if (!moduleInfo) continue

        const dto: ManifestDTO = moduleInfo as any
        dto.isActive = config.activeFeatures[dto.name]?.isActive || false
        dto.isActionHandler = config.activeFeatures[dto.name]?.runtime?.isActionHandler || false
        dto.isHomeHandler = config.activeFeatures[dto.name]?.runtime?.isHomeHandler || false
        dto.activeVersion = dto.isActive ? config.activeFeatures[dto.name]?.version || null : null
        dto.lastVersion = dto.isActive
          ? await this.getVersions(registryUrl, dto.name)
              .then((x) => x.sort(rcompare)[0])
              .catch(() => null)
          : null // ToDo: how does this affect performance?
        dto.order = i++
        dto.sourceRegistry = {
          url: registryUrl,
          isDev: activeRegistries.find((r) => r.url === registryUrl)?.isDev,
        }
        if (!dto.hostnames) dto.hostnames = []
        dto.hostnames = mergeDedupe([dto.hostnames, [contextId]])
        dto.available = false
        dto.isMyDapplet = false
        dtos.push(dto)
      }
    }

    // MyDapplets
    if (filter === 'all' || filter === 'local') {
      const myDapplets = await this._globalConfigService.getMyDapplets()
      const myDappletsToAdd = await Promise.all(
        myDapplets.map(async (x) => {
          if (!activeRegistries.find((r) => r.url === x.registryUrl)) return

          const existingMyDappletDto = dtos.find(
            (y) => y.sourceRegistry.url === x.registryUrl && y.name === x.name
          )
          if (existingMyDappletDto) {
            existingMyDappletDto.isMyDapplet = true
            return
          }

          const moduleInfo = await this.getModuleInfoByName(x.registryUrl, x.name)
          if (!moduleInfo) return

          return moduleInfo
        })
      ).then((x) => x.filter((y) => !!y))

      if (myDappletsToAdd.length > 0) {
        const registryUrls = Array.from(new Set(myDappletsToAdd.map((x) => x.registryUrl)))
        for (const registryUrl of registryUrls) {
          const owners = Array.from(
            new Set([
              ...listingAccounts,
              ...myDappletsToAdd.filter((x) => x.registryUrl === registryUrl).map((x) => x.author),
            ])
          )
          const registry = await this._moduleManager.registryAggregator.getRegistryByUri(
            registryUrl
          )
          // console.log({ owners, listingAccounts, myDappletsToAdd })
          const moduleInfosByContextId = await registry.getModuleInfo(contextIds, owners)

          for (const [contextId, moduleInfos] of Object.entries(moduleInfosByContextId)) {
            for (const moduleInfo of moduleInfos) {
              if (
                !myDappletsToAdd.find(
                  (x) => x.registryUrl === moduleInfo.registryUrl && x.name === moduleInfo.name
                )
              )
                continue

              const dto = dtos.find((d) => d.name === moduleInfo.name)
              if (!dto) {
                const dto: ManifestDTO = moduleInfo as any
                const config = await this._globalConfigService.getSiteConfigById(contextId) // ToDo: which contextId should we compare?
                dto.isActive =
                  config.activeFeatures[dto.name]?.isActive ||
                  everywhereConfig.activeFeatures[dto.name]?.isActive ||
                  false
                dto.isActionHandler =
                  config.activeFeatures[dto.name]?.runtime?.isActionHandler ||
                  everywhereConfig.activeFeatures[dto.name]?.runtime?.isActionHandler ||
                  false
                dto.isHomeHandler =
                  config.activeFeatures[dto.name]?.runtime?.isHomeHandler ||
                  everywhereConfig.activeFeatures[dto.name]?.runtime?.isHomeHandler ||
                  false
                dto.activeVersion = dto.isActive
                  ? config.activeFeatures[dto.name]?.version ||
                    everywhereConfig.activeFeatures[dto.name]?.version ||
                    null
                  : null
                dto.lastVersion = dto.isActive
                  ? await this.getVersions(registryUrl, dto.name).then((x) => x.sort(rcompare)[0])
                  : null // ToDo: how does this affect performance?
                dto.order = i++
                dto.sourceRegistry = {
                  url: registryUrl,
                  isDev: configRegistries.find((r) => r.url === registryUrl).isDev,
                }
                if (!dto.hostnames) dto.hostnames = []
                dto.hostnames = mergeDedupe([dto.hostnames, [contextId]])
                dto.available = true
                dto.isMyDapplet = true
                dtos.push(dto)
              } else {
                // ToDo: move this merging logic to aggragator
                if (!dto.hostnames) dto.hostnames = []
                dto.hostnames = mergeDedupe([dto.hostnames, [contextId]])
              }
            }
          }
        }
      }
    }

    // const endTime = Date.now()
    // console.log(`getFeaturesByHostnames  #${requestId} end: ${endTime - startTime} ms`)

    return dtos
  }

  @Measure()
  private async _setFeatureActive(
    name: string,
    version: string | undefined,
    hostnames: string[],
    isActive: boolean,
    order: number,
    registryUrl: string,
    tabId: number
  ): Promise<DappletRuntimeResult | null> {
    // ToDo: check that the module is (not) active already

    // Clear cached dependencies
    globalClear(this._moduleManager, '_getOptimizedChildDependenciesAndManifest')

    hostnames = Array.from(new Set(hostnames)) // deduplicate

    if (!version && isActive) {
      const versions = await this.getVersions(registryUrl, name)
      version = versions.sort(rcompare)[0] // Last version by SemVer
    }

    // ToDo: save registry url of activate module?
    for (const hostname of hostnames) {
      const config = await this._globalConfigService.getSiteConfigById(hostname)
      if (!isActive && config.activeFeatures[name]) {
        version = config.activeFeatures[name].version
      }
      config.activeFeatures[name] = {
        version,
        isActive,
        order,
        runtime: null,
        registryUrl,
      }

      await this._globalConfigService.updateSiteConfig(config)
    }

    try {
      const runtime = await new Promise<DappletRuntimeResult>((resolve, reject) => {
        // listening of loading/unloading from contentscript
        const listener = (message, sender: Runtime.MessageSender) => {
          if (sender.tab.id !== tabId) return
          if (!message || !message.type || !message.payload) return

          const p = message.payload
          if (message.type === 'FEATURE_LOADED') {
            if (
              p.name === name &&
              p.branch === DEFAULT_BRANCH_NAME &&
              p.version === version &&
              isActive === true
            ) {
              browser.runtime.onMessage.removeListener(listener)

              resolve(p.runtime)
            }
          } else if (message.type === 'FEATURE_UNLOADED') {
            if (
              p.name === name &&
              p.branch === DEFAULT_BRANCH_NAME &&
              p.version === version &&
              isActive === false
            ) {
              browser.runtime.onMessage.removeListener(listener)
              resolve(p.runtime)
            }
          } else if (message.type === 'FEATURE_LOADING_ERROR') {
            // if(
            //   p.name === name &&
            //   p.branch === DEFAULT_BRANCH_NAME &&
            //   p.version === version &&
            //   isActive === true
            // ){
            browser.runtime.onMessage.removeListener(listener)
            reject(p.error)
            // }
          } else if (message.type === 'FEATURE_UNLOADING_ERROR') {
            if (
              p.name === name &&
              p.branch === DEFAULT_BRANCH_NAME &&
              p.version === version &&
              isActive === false
            ) {
              browser.runtime.onMessage.removeListener(listener)
              reject(p.error)
            }
          }
        }

        browser.runtime.onMessage.addListener(listener)

        // reject if module is loading too long
        setTimeout(() => {
          browser.runtime.onMessage.removeListener(listener)
          reject('Loading timeout exceed')
        }, 30000)

        // ToDo: use global dapplet_activated event instead of FEATURE_ACTIVATED
        // sending command to contentscript
        // browser.tabs.sendMessage(tabId, {
        //   type: isActive ? 'FEATURE_ACTIVATED' : 'FEATURE_DEACTIVATED',
        //   payload: [
        //     {
        //       name,
        //       version,
        //       branch: DEFAULT_BRANCH_NAME, // ToDo: fix branch
        //       order,
        //       contextIds: hostnames,
        //     },
        //   ],
        // })

        // global notification
        const event = isActive ? 'dapplet_activated' : 'dapplet_deactivated'
        const data = {
          name,
          branch: DEFAULT_BRANCH_NAME,
          version,
          order,
          contextIds: hostnames,
        }

        EventBus.emit(event, data)
      })

      // ToDo: merge with config updating upper
      for (const hostname of hostnames) {
        const config = await this._globalConfigService.getSiteConfigById(hostname)
        config.activeFeatures[name].runtime = runtime
        await this._globalConfigService.updateSiteConfig(config)
      }

      return runtime
    } catch (err) {
      // revert config if error
      for (const hostname of hostnames) {
        const config = await this._globalConfigService.getSiteConfigById(hostname)
        config.activeFeatures[name] = {
          version,
          isActive: !isActive,
          order,
          runtime: null,
          registryUrl,
        }
        await this._globalConfigService.updateSiteConfig(config)
      }

      // ToDo: error doesn't come to popup without this rethrowing

      throw new Error(err)
    }
  }

  async activateFeature(
    name: string,
    version: string | undefined,
    hostnames: string[],
    order: number,
    registryUrl: string,
    req: MessageWrapperRequest
  ): Promise<DappletRuntimeResult | null> {
    const tabId = req?.sender?.tab?.id
    if (!tabId) throw new Error('Tab ID is required')
    this._analyticsService.track({ idgoal: AnalyticsGoals.DappletActivated, dapplet: name })
    return await this._setFeatureActive(name, version, hostnames, true, order, registryUrl, tabId)
  }

  async deactivateFeature(
    name: string,
    version: string | undefined,
    hostnames: string[],
    order: number,
    registryUrl: string,
    req: MessageWrapperRequest
  ): Promise<DappletRuntimeResult | null> {
    const tabId = req?.sender?.tab?.id
    if (!tabId) throw new Error('Tab ID is required')
    this._analyticsService.track({ idgoal: AnalyticsGoals.DappletDeactivated, dapplet: name })
    return await this._setFeatureActive(name, version, hostnames, false, order, registryUrl, tabId)
  }

  async reloadFeature(
    name: string,
    version: string | undefined,
    hostnames: string[],
    order: number,
    registryUrl: string,
    req: MessageWrapperRequest
  ): Promise<void> {
    const tabId = req?.sender?.tab?.id
    if (!tabId) throw new Error('Tab ID is required')
    const modules = await this.getActiveModulesByHostnames(hostnames)
    if (!modules.find((m) => m.name === name)) return
    await this._setFeatureActive(name, version, hostnames, false, order, registryUrl, tabId)
    await this._setFeatureActive(name, version, hostnames, true, order, registryUrl, tabId)
  }

  public async getActiveModulesByHostnames(contextIds: string[]) {
    const globalConfig = await this._globalConfigService.get()
    if (globalConfig.suspended) return []

    const modules: {
      name: string
      branch: string
      version: string
      order: number
      hostnames: string[]
    }[] = []

    // Activate dynamic adapter for dynamic contexts searching
    const hostnames = contextIds.filter((x) => /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/gm.test(x))
    if (hostnames.length > 0) {
      const dynamicAdapter = await this._globalConfigService.getDynamicAdapter()
      if (dynamicAdapter) {
        const parsed = parseModuleName(dynamicAdapter)
        if (parsed) {
          modules.push({
            name: parsed.name,
            branch: parsed.branch,
            version: parsed.version,
            order: -1,
            hostnames: hostnames,
          })
        }
      }
    }

    const isThereActiveDapplets = await this._globalConfigService.isThereActiveDapplets()
    if (!isThereActiveDapplets) return modules

    const configs = await Promise.all(
      contextIds.map((h) => this._globalConfigService.getSiteConfigById(h))
    )

    let i = 0
    for (const config of configs) {
      if (config.paused) continue
      for (const name in config.activeFeatures) {
        if (config.activeFeatures[name].isActive !== true) continue

        const branch = DEFAULT_BRANCH_NAME // ToDo: is it correct?
        const version = config.activeFeatures[name].version
        const index = modules.findIndex(
          (m) => m.name === name && m.branch === branch && m.version === version
        )

        if (index !== -1) {
          modules[index].hostnames.push(config.hostname)
        } else {
          modules.push({
            name,
            branch,
            version,
            order: i++,
            hostnames: [config.hostname],
          })
        }
      }
    }

    // Activate dapplets enabled everywhere
    // ToDo: it reduces performance because of additional request to a registry
    //       it's need to be fixed after registry improvements (should return all contextIds by module)
    const availableModules = await this.getFeaturesByHostnames(contextIds, null)
    const config = await this._globalConfigService.getSiteConfigById(CONTEXT_ID_WILDCARD)
    for (const dto of availableModules) {
      if (config.activeFeatures[dto.name]?.isActive === true) {
        const moduleId = {
          name: dto.name,
          branch: DEFAULT_BRANCH_NAME,
          version: config.activeFeatures[dto.name].version,
        }
        const index = modules.findIndex((m) => areModulesEqual(m, moduleId))

        if (index !== -1) {
          modules[index].hostnames.push(config.hostname)
        } else {
          modules.push({
            name: moduleId.name,
            branch: moduleId.branch,
            version: moduleId.version,
            order: i++,
            hostnames: dto.hostnames,
          })
        }
      }
    }

    // Choose last dev-versions if available
    const configuredRegistries = await this._globalConfigService.getRegistries()
    const isDevRegistriesAvailable = configuredRegistries.filter((x) => x.isDev).length > 0

    if (isDevRegistriesAvailable) {
      for (const module of modules) {
        const lastDevVersion = await this._moduleManager.registryAggregator.getLastVersion(
          module.name,
          module.branch,
          true
        )
        if (lastDevVersion) {
          module.version = lastDevVersion
        }
      }
    }

    return modules
  }

  public async getModulesWithDeps(
    modules: {
      name: string
      branch?: string
      version?: string
      contextIds: string[]
    }[]
  ) {
    if (modules.length === 0) return []
    const modulesWithDeps = await this._moduleManager.resolveDependencies(modules)
    // ToDo: catch errors
    // ToDo: run parallel
    const dists = await Promise.all(
      modulesWithDeps.map((m) => this._moduleManager.loadModule(m.manifest))
    )

    return modulesWithDeps.map((m, i) => ({
      manifest: Object.assign(m.manifest, dists[i].internalManifest), // merge manifests from registry and bundle (zip)
      scriptOrConfig: dists[i].scriptOrConfig,
      defaultConfig: dists[i].defaultConfig,
      schemaConfig: dists[i].schemaConfig,
    }))
  }

  public async getAllDevModules() {
    const descriptors = await this._walletService.getWalletDescriptors()
    const users = descriptors
      .filter((x) => x.available && x.connected)
      .map((x) => ({
        name: x.account,
        blockchain: x.chain.split('/')[0],
      }))
    return this._moduleManager.registryAggregator.getAllDevModules({ users })
  }

  // ToDo: move to another service?
  public async deployModule(
    mi: ModuleInfo,
    vi: VersionInfo,
    targetStorages: StorageTypes[],
    targetRegistry: string
  ): Promise<{ scriptUrl: string }> {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(targetRegistry)
    if (!registry) throw new Error('No registry with this url exists in config.')

    try {
      const scriptUrl = await this.uploadModule(mi, vi, targetStorages)
      await registry.addModule(mi, vi) // Register manifest in Registry
      return { scriptUrl }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public async uploadModule(
    mi: ModuleInfo,
    vi: VersionInfo | null,
    targetStorages: StorageTypes[]
  ): Promise<string> {
    try {
      // ToDo: check everything before publishing

      if (!mi.name) throw new Error('Module name is required.')
      if (!/^[a-z0-9][a-z0-9-.]*[a-z0-9]$/gm.test(mi.name)) throw new Error('Invalid module name.')
      if (
        mi.icon &&
        mi.icon.uris.length > 0 &&
        !(mi.icon.uris[0].endsWith('.png') || mi.icon.uris[0].startsWith('data:image/png;base64'))
      )
        throw new Error('Type of module icon must be PNG.')

      let scriptUrl = null

      const zip = new JSZip()

      if (vi && vi.main) {
        const arr = await this._storageAggregator.getResource(vi.main)
        if (vi.type === ModuleTypes.ParserConfig) {
          zip.file('index.json', arr)
          const config = new TextDecoder('utf-8').decode(new Uint8Array(arr))
          const addStylesToZip = async (confiWithStyles: any, keyToReplace: string) =>
            Promise.all(
              Object.entries(confiWithStyles).map(async ([key, value]: [string, any]) => {
                if (typeof value === 'string' && key === keyToReplace) {
                  const cssArr = await this._storageAggregator.getResource({
                    uris: [joinUrls(vi.main.uris[0], value)],
                    hash: null,
                  })
                  if (cssArr) zip.file(value, cssArr)
                } else if (typeof value === 'object') {
                  await addStylesToZip(value, keyToReplace)
                }
              })
            )

          await addStylesToZip(JSON.parse(config), 'styles')
        } else {
          zip.file('index.js', arr)
        }
      }

      if (vi && vi.defaultConfig && vi.type !== ModuleTypes.ParserConfig) {
        const arr = await this._storageAggregator.getResource(vi.defaultConfig)
        zip.file('default.json', arr)
      }

      if (vi && vi.schemaConfig && vi.type !== ModuleTypes.ParserConfig) {
        const arr = await this._storageAggregator.getResource(vi.schemaConfig)
        zip.file('schema.json', arr)
      }

      // upload overlays declared in manifest
      // it packs all files from `assets-manifest.json` into tar container
      if (vi && vi.overlays) {
        for (const overlayName in vi.overlays) {
          const baseUrl = vi.overlays[overlayName].uris[0]
          const assetManifestUrl = new URL('assets-manifest.json', baseUrl).href
          const arr = await this._storageAggregator
            .getResource({ uris: [assetManifestUrl], hash: null })
            .catch(() => {
              throw new Error('Cannot find an assets manifest by the URL: ' + assetManifestUrl)
            })
          const json = String.fromCharCode.apply(null, new Uint8Array(arr))

          let assetManifest: any = null
          try {
            assetManifest = JSON.parse(json)
          } catch (_) {
            throw new Error(
              'The assets manifest has invalid JSON.\nRequested URL: ' + assetManifestUrl
            )
          }

          if (
            !(
              typeof assetManifest === 'object' &&
              !Array.isArray(assetManifest) &&
              assetManifest !== null
            )
          ) {
            throw new Error(
              'An assets manifest must be a valid JSON object.\n' +
                'Example: {"index.html": "index.html", "styles.css": "css-62d9da.css"}\n' +
                'Requested URL: ' +
                assetManifestUrl
            )
          }

          const assets = Object.values(assetManifest)
          if (assets.indexOf('index.html') === -1) {
            throw new Error(
              'An assets manifest must contain a path to the `index.html` file.\n' +
                'Example: {"index.html": "index.html", "styles.css": "css-62d9da.css"}\n' +
                'Requested URL: ' +
                assetManifestUrl
            )
          }

          const files = await Promise.all(
            assets.map((x: string) =>
              this._storageAggregator
                .getResource({ uris: [new URL(x, baseUrl).href], hash: null })
                .then((y) => ({ url: x, arr: y }))
            )
          )

          const hashUris = await this._storageAggregator.saveDir(files, targetStorages)
          vi.overlays[overlayName] = hashUris
        }

        // Add manifest to zip (just for overlays yet)
        const manifest = { overlays: vi.overlays }
        const manifestJson = JSON.stringify(manifest)
        const manifestArr = new TextEncoder().encode(manifestJson)
        zip.file('dapplet.json', manifestArr)
      }

      if (vi && vi.main) {
        // Dist file publishing
        const buf = await zip.generateAsync({
          type: 'uint8array',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 },
        })
        const blob = new Blob([buf], { type: 'application/zip' })
        const hashUris = await this._storageAggregator.save(blob, targetStorages)

        // Manifest editing
        vi.dist = hashUris
        scriptUrl = hashUris.uris[0] // ToDo: remove it?
      }

      // Upload icon and NFT image
      await this._uploadModuleInfoIcons(mi, targetStorages)

      if (mi.metadata && mi.metadata.uris.length > 0) {
        // Detailed description publishing
        const buf = await this._storageAggregator.getResource(mi.metadata)
        const blob = new Blob([buf], { type: 'image/png' })
        const hashUris = await this._storageAggregator.save(blob, targetStorages)

        // Manifest editing
        mi.metadata = hashUris
      }

      // Use a current version of the extension as target value
      if (vi && EXTENSION_VERSION) {
        vi.extensionVersion = EXTENSION_VERSION
      }

      return scriptUrl
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public async removeDapplet(name: string, hostnames: string[]) {
    let version = null
    let order = null
    let wasActive = false

    for (const hostname of hostnames) {
      const config = await this._globalConfigService.getSiteConfigById(hostname)
      if (!config.activeFeatures[name]) continue
      version = config.activeFeatures[name].version
      order = config.activeFeatures[name].order
      wasActive = wasActive || config.activeFeatures[name].isActive
      delete config.activeFeatures[name]
      await this._globalConfigService.updateSiteConfig(config)
    }

    if (wasActive) {
      // sending command to contentscript
      const activeTab = await getCurrentTab()
      if (!activeTab) return
      browser.tabs.sendMessage(activeTab.id, {
        type: 'FEATURE_DEACTIVATED',
        payload: [
          {
            name,
            version,
            branch: DEFAULT_BRANCH_NAME, // ToDo: fix branch
            order,
            contextIds: hostnames,
          },
        ],
      })
    }
  }

  async getRegistries() {
    const configRegistries = await this._globalConfigService.getRegistries()
    const result = configRegistries.map(async (c) => {
      const reg = await this._moduleManager.registryAggregator.getRegistryByUri(c.url)
      return {
        isAvailable: reg?.isAvailable || false,
        error: reg?.error,
        ...c,
      }
    })

    return Promise.all(result)
  }

  public async getOwnership(registryUri: string, moduleName: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    const owner = await registry.getOwnership(moduleName)
    return owner
  }

  public async getModuleNftUrl(registryUri: string, moduleName: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    const url = await registry.getModuleNftUrl(moduleName)
    return url
  }

  public async getVersionInfo(
    registryUri: string,
    moduleName: string,
    branch: string,
    version: string
  ) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    if (!registry) return null
    return registry.getVersionInfo(moduleName, branch, version)
  }

  public async getModuleInfoByName(registryUrl: string, moduleName: string) {
    const registriesConfig = await this._globalConfigService.getRegistries()
    const config = registriesConfig.find((x) => x.url === registryUrl)
    if (!config) return null
    const isDev = config.isDev

    if (isDev) {
      const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUrl)
      if (!registry) return null
      const moduleInfo = await registry.getModuleInfoByName(moduleName)
      return moduleInfo
    } else {
      // const moduleInfo = await this._moduleInfoBrowserStorage.get(registryUrl, moduleName);

      // if (moduleInfo) {
      //     return moduleInfo;
      // } else {
      const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUrl)
      if (!registry) return null
      const moduleInfo = await registry.getModuleInfoByName(moduleName)
      // if (moduleInfo) await this._moduleInfoBrowserStorage.create(moduleInfo); // cache ModuleInfo into chrome storage
      return moduleInfo
      // }
    }
  }

  public async transferOwnership(
    registryUri: string,
    moduleName: string,
    oldAccount: string,
    newAccount: string
  ) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.transferOwnership(moduleName, oldAccount, newAccount)
  }

  public async getContextIds(registryUri: string, moduleName: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    return registry.getContextIds(moduleName)
  }

  public async addContextId(registryUri: string, moduleName: string, contextId: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.addContextId(moduleName, contextId)
  }

  public async removeContextId(registryUri: string, moduleName: string, contextId: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.removeContextId(moduleName, contextId)
  }
  public async getAdmins(registryUri: string, moduleName: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    return registry.getAdmins(moduleName)
  }

  public async addAdmin(registryUri: string, moduleName: string, adressAdmin: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.addAdmin(moduleName, adressAdmin)
  }

  public async removeAdmin(registryUri: string, moduleName: string, adressAdmin: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.removeAdmin(moduleName, adressAdmin)
  }

  public async editModuleInfo(registryUri: string, targetStorages: StorageTypes[], mi: ModuleInfo) {
    // Upload icon and NFT image
    await this._uploadModuleInfoIcons(mi, targetStorages)

    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    await registry.editModuleInfo(mi)
  }

  public async getVersions(registryUri: string, moduleName: string) {
    const registry = await this._moduleManager.registryAggregator.getRegistryByUri(registryUri)
    if (!registry) throw new Error('No registry with this url exists in config.')
    const versions = await registry.getVersionNumbers(moduleName, DEFAULT_BRANCH_NAME)
    if (versions.length === 0) throw new Error('This module has no versions.')
    return versions
  }

  public async getUserSettingsForOverlay(registryUrl: string, moduleName: string) {
    const mi = await this.getModuleInfoByName(registryUrl, moduleName)
    const versions = await this.getVersions(registryUrl, moduleName)
    const version = versions.sort(rcompare)[0] // Last version by SemVer
    const vi = await this._moduleManager.registryAggregator.getVersionInfo(
      mi.name,
      DEFAULT_BRANCH_NAME,
      version
    )
    const dist = await this._moduleManager.loadModule(vi)
    const configRegistries = await this._globalConfigService.getRegistries()

    return {
      mi: {
        ...mi,
        sourceRegistry: {
          url: registryUrl,
          isDev: configRegistries.find((r) => r.url === registryUrl).isDev,
        },
      },
      vi,
      schemaConfig: dist.schemaConfig,
      defaultConfig: dist.defaultConfig,
    }
  }

  public async getResource(hashUris: StorageRef) {
    const arr = await this._storageAggregator.getResource(hashUris)
    const base64 = base64ArrayBuffer(arr)
    return base64
  }

  private async _uploadModuleInfoIcons(
    mi: ModuleInfo,
    targetStorages: StorageTypes[]
  ): Promise<void> {
    const { name, title } = mi

    if (mi.icon && mi.icon.uris.length > 0) {
      if (mi.icon.uris[0].startsWith('data:image/png;base64')) {
        // Icon file publishing (from base64)
        const res = await fetch(mi.icon.uris[0])
        const iconBlob = await res.blob()
        const iconHashUris = await this._storageAggregator.save(iconBlob, targetStorages)

        // Generate NFT Image
        const imageBlob = await generateNftImage({ name, title, icon: iconBlob })
        const imageHashUris = await this._storageAggregator.save(imageBlob, targetStorages)

        // Manifest editing
        mi.icon = iconHashUris
        mi.image = imageHashUris
      } else {
        // Icon file publishing
        const buf = await this._storageAggregator.getResource(mi.icon)
        const iconBlob = new Blob([buf], { type: 'image/png' })
        const iconHashUris = await this._storageAggregator.save(iconBlob, targetStorages)

        // Generate NFT Image
        const imageBlob = await generateNftImage({ name, title, icon: iconBlob })
        const imageHashUris = await this._storageAggregator.save(imageBlob, targetStorages)

        // Manifest editing
        mi.icon = iconHashUris
        mi.image = imageHashUris
      }
    } else {
      // Generate NFT Image
      const imageBlob = await generateNftImage({ name: mi.name, title: mi.title }) // no module icon
      const imageHashUris = await this._storageAggregator.save(imageBlob, targetStorages)

      // Manifest editing
      mi.image = imageHashUris
    }
  }
}
