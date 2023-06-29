import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { Subject } from 'rxjs'
import { filter } from 'rxjs/operators'
import { maxSatisfying, valid } from 'semver'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../background/models/moduleInfo'
import VersionInfo from '../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD, DEFAULT_BRANCH_NAME, ModuleTypes } from '../common/constants'
import * as EventBus from '../common/global-event-bus'
import {
  areModulesEqual,
  formatModuleId,
  joinUrls,
  multipleReplace,
  parseModuleName,
} from '../common/helpers'
import { NotificationType } from '../common/models/notification'
import { DefaultConfig, SchemaConfig } from '../common/types'
import { AppStorage } from './appStorage'
import Core from './core'
import { BaseEvent } from './events/baseEvent'
import { EventBus as ModuleEventBus } from './events/eventBus'
import { __decorate } from './global'
import BuiltInModules from './modules'
import { ConfigAdapter } from './modules/config-adapter'
import { ParserConfig } from './modules/config-adapter/types'
import { IContentAdapter, IResolver } from './types'

type RegistriedModule = {
  manifest: VersionInfo
  clazz: any
  instance?: any
  order: number
  contextIds: string[]
  constructorDependencies: string[]
  instancedPropertyDependencies: { [name: string]: any }
  instancedConstructorDeps: any[]
  activateMethodsDependencies: string[]
  instancedActivateMethodsDependencies: any[]
  defaultConfig?: DefaultConfig
  schemaConfig?: SchemaConfig
  onActionHandler?: Function
  onHomeHandler?: Function
  onShareLinkHandler?: Function
  onWalletsUpdateHandler?: Function
  onConnectedAccountsUpdateHandler?: Function
  moduleEventBus?: ModuleEventBus
}

type NotRegisteredModule = {
  manifest: VersionInfo
  scriptOrConfig: string | ParserConfig
  order: number
  contextIds: string[]
  defaultConfig?: DefaultConfig
  schemaConfig?: SchemaConfig
}

export const widgets = []

const DAPPLETS_ORIGINAL_HREF: string = window['DAPPLETS_ORIGINAL_HREF']
const IS_LIBRARY = window['DAPPLETS_JSLIB'] === true

export class Injector {
  public availableContextIds: string[] = []
  public registry: RegistriedModule[] = []

  constructor(
    public core: Core,
    private eventStream: Subject<BaseEvent>,
    private env?: { shareLinkPayload: { moduleId: string; payload: any; isAllOk: boolean } }
  ) {
    this._setContextActivivty(
      [new URL(DAPPLETS_ORIGINAL_HREF ?? window.location.href).hostname],
      undefined,
      true
    )
    window.exports = {} // for CommonJS modules compatibility
  }

  public async loadModules(
    modules: {
      name: string
      branch: string
      version: string
      order: number
      contextIds: string[]
    }[]
  ) {
    modules.forEach((f) =>
      console.log(
        `[DAPPLETS]: The module ${f.name}${f.branch ? '#' + f.branch : ''}${
          f.version ? '@' + f.version : ''
        } was activated.`
      )
    )

    modules = modules.filter(
      (x) =>
        x.contextIds.filter(
          (v) => this.availableContextIds.includes(v) || v === CONTEXT_ID_WILDCARD
        ).length > 0
    )

    if (!modules || !modules.length) return
    modules.forEach(
      (x) =>
        (x.contextIds = multipleReplace(
          x.contextIds,
          CONTEXT_ID_WILDCARD,
          this.availableContextIds
        ))
    )

    // ToDo: add modules to registry before loading

    const { getModulesWithDeps } = await initBGFunctions(browser)
    const loadedModules: {
      manifest: VersionInfo
      scriptOrConfig: string | ParserConfig
      defaultConfig?: DefaultConfig
      schemaConfig?: SchemaConfig
    }[] = await getModulesWithDeps(modules)

    modules.forEach(
      (a) =>
        !loadedModules.find(
          (b) =>
            a.name === b.manifest.name &&
            (!a.branch || a.branch === b.manifest.branch) &&
            (!a.version || a.version === 'latest' || a.version === b.manifest.version)
        ) &&
        console.log(`[DAPPLETS]: Loading of module ${a.name}#${a.branch}@${a.version} was skipped.`)
    )

    const orderedModules = loadedModules.map((l) => {
      const m = modules.find((m) => areModulesEqual(m, l.manifest))

      return {
        ...l,
        order: m?.order,
        contextIds: m?.contextIds || [window.location.hostname],
      }
    })

    await this._processModules(orderedModules)

    // module initialization
    for (let i = 0; i < this.registry.length; i++) {
      const m = this.registry[i]
      if (m.instance) continue

      m.instancedConstructorDeps = m.constructorDependencies.map((d) => {
        return this._proxifyModule(this._getDependency(m.manifest, d), m)
      })
      m.instancedActivateMethodsDependencies = m.activateMethodsDependencies.map((d) => {
        return this._proxifyModule(this._getDependency(m.manifest, d), m)
      })

      try {
        // ToDo: compare "m.instancedDeps.length" and "m.clazz.constructor.length"

        m.instance = new m.clazz(...m.instancedConstructorDeps)
        if (m.instance.activate !== undefined) {
          if (typeof m.instance.activate === 'function') {
            // ToDo: activate modules in parallel
            await m.instance.activate(...m.instancedActivateMethodsDependencies)
          } else {
            throw new Error('activate() must be a function.')
          }
        }

        // Transfer data from share links (for dapplets already activated)
        const sl = this.env?.shareLinkPayload
        const slModuleId = sl ? parseModuleName(sl.moduleId) : null
        if (sl && areModulesEqual(slModuleId, m.manifest)) {
          if (sl.payload) {
            try {
              this.sendShareLinkData(slModuleId.name, sl.payload)
            } catch (e) {
              console.error(e)
            }
          }
        }
        console.log(
          `[DAPPLETS]: The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is loaded.`
        )
        browser.runtime.sendMessage({
          type: 'FEATURE_LOADED',
          payload: {
            name: m.manifest.name,
            branch: m.manifest.branch,
            version: m.manifest.version,
            runtime: {
              isActionHandler: !!m.onActionHandler,
              isHomeHandler: !!m.onHomeHandler,
            },
          },
        })
      } catch (err) {
        console.error(
          `Error of loading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `,
          err
        )
        browser.runtime.sendMessage({
          type: 'FEATURE_LOADING_ERROR',
          payload: {
            name: m.manifest.name,
            branch: m.manifest.branch,
            version: m.manifest.version,
            error: err.message,
          },
        })
      }
    }
  }

  public async unloadModules(modules: { name: string; branch: string; version: string }[]) {
    modules.forEach((f) =>
      console.log(
        `[DAPPLETS]: The module ${f.name}${f.branch ? '#' + f.branch : ''}${
          f.version ? '@' + f.version : ''
        } was deactivated.`
      )
    )

    const registriedModules = modules.map((m) =>
      this.registry.find((r) => areModulesEqual(m, r.manifest))
    )

    for (const m of registriedModules) {
      if (!m) return

      try {
        m.instancedConstructorDeps.forEach((d) => d.detachConfig())
        Object.values(m.instancedPropertyDependencies).forEach((x) => x.detachConfig())

        m.moduleEventBus?.destroy()

        if (m.instance.deactivate !== undefined) {
          if (typeof m.instance.deactivate === 'function') {
            // ToDo: deactivate modules in parallel
            await m.instance.deactivate()
          } else {
            throw new Error('deactivate() must be a function.')
          }
        }

        // Destroy all overlays related with the module
        this.core.overlayManager.unregisterAll(m.manifest.name)

        console.log(
          `[DAPPLETS]: The module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version} is unloaded.`
        )
        browser.runtime.sendMessage({
          type: 'FEATURE_UNLOADED',
          payload: {
            name: m.manifest.name,
            branch: m.manifest.branch,
            version: m.manifest.version,
          },
        })
        this.registry = this.registry.filter((r) => r !== m)
      } catch (err) {
        console.error(
          `Error of unloading the module ${m.manifest.name}#${m.manifest.branch}@${m.manifest.version}: `,
          err
        )
        browser.runtime.sendMessage({
          type: 'FEATURE_UNLOADING_ERROR',
          payload: {
            name: m.manifest.name,
            branch: m.manifest.branch,
            version: m.manifest.version,
            error: err.message,
          },
        })
      }
    }
  }

  public async openDappletAction(moduleName: string) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    if (!module || !module.instance) throw Error('The dapplet is not activated.')
    module.onActionHandler?.()
  }

  public async openDappletHome(moduleName: string) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    if (!module || !module.instance) throw Error('The dapplet is not activated.')
    module.onHomeHandler?.()
  }

  public async sendShareLinkData(moduleName: string, data: any) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    if (!module || !module.instance) throw Error('The dapplet is not activated.')
    module.onShareLinkHandler?.(data)
  }

  public async executeWalletsUpdateHandler() {
    this.registry.find((m) => {
      m.onWalletsUpdateHandler?.()
    })
  }

  public async executeConnectedAccountsUpdateHandler() {
    this.registry.find((m) => {
      m.onConnectedAccountsUpdateHandler?.()
    })
  }

  public setActionHandler(moduleName: string, handler: Function) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    module.onActionHandler = handler
  }

  public setHomeHandler(moduleName: string, handler: Function) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    module.onHomeHandler = handler
  }

  public setShareLinkHandler(moduleName: string, handler: Function) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    module.onShareLinkHandler = handler
  }

  public setWalletsUpdateHandler(moduleName: string, handler: Function) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    module.onWalletsUpdateHandler = handler
  }

  public setConnectedAccountsUpdate(moduleName: string, handler: Function) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    module.onConnectedAccountsUpdateHandler = handler
  }

  public async dispose() {
    const modules = this.registry.map((x) => x.manifest)
    await this.unloadModules(modules)
  }

  private async _processModules(modules: NotRegisteredModule[]) {
    console.log('modules in _processModules', modules)
    const { getModulesWithDeps, getSwarmGateway, getPreferedOverlayStorage } =
      await initBGFunctions(browser)
    const { core } = this

    const swarmGatewayUrl = await getSwarmGateway()
    const preferedOverlayStorage = await getPreferedOverlayStorage()
    modules.forEach((a) => {
      if (a.order === undefined) a.order = 0
      return a
    })
    modules.sort((a, b) => a.order - b.order)
    console.log('modules after sort', modules)
    modules.sort((a, b) => {
      if (a.manifest.type === ModuleTypes.Library) return -1
      if (b.manifest.type === ModuleTypes.Library) return 1
      return 0
    })
    console.log('modules after II sort', modules)
    for (const module of modules) {
      const { manifest, scriptOrConfig, contextIds, defaultConfig, schemaConfig } = module

      // Module is loaded already
      const registeredModule = this.registry.find((m) => areModulesEqual(m.manifest, manifest))
      if (registeredModule) {
        if (contextIds) {
          if (registeredModule.contextIds) {
            registeredModule.contextIds.push(...contextIds)
          } else {
            registeredModule.contextIds = [...contextIds]
          }
        }
        continue
      }

      const moduleEventBus = new ModuleEventBus(
        this.eventStream.pipe(filter((e) => e.namespace === manifest.name))
      )

      // ToDo: elemenate the boilerplate
      const coreWrapper = {
        overlayManager: core.overlayManager,
        contextStarted: (contextIds: any[], parentContext: string) =>
          this._setContextActivivty(contextIds, parentContext, true),
        contextFinished: (contextIds: any[], parentContext: string) =>
          this._setContextActivivty(contextIds, parentContext, false),
        connect: core.connect.bind(core),
        overlay: (cfg, eventDef) => {
          cfg.source = manifest.name
          cfg.module = { name: manifest.name, registryUrl: manifest.registryUrl }
          if (cfg.name) {
            const overlay = manifest.overlays?.[cfg.name]
            if (!overlay)
              throw new Error(`Cannot find overlay with name "${cfg.name}" in the manifest.`)

            const url = new URL(overlay.uris[0])

            if (preferedOverlayStorage === 'centralized' && overlay.hash) {
              cfg.url = joinUrls(
                'https://dapplet-api.s3-website.nl-ams.scw.cloud/',
                overlay.hash.replace('0x', '')
              )
              return core.overlay(cfg, eventDef)
            } else if (url.protocol === 'bzz:') {
              cfg.url = joinUrls(swarmGatewayUrl, `bzz/${url.pathname.slice(2)}`)
              return core.overlay(cfg, eventDef)
            } else if (url.protocol === 'http:' || url.protocol === 'https:') {
              cfg.url = url.href
              return core.overlay(cfg, eventDef)
            } else if (preferedOverlayStorage === 'decentralized' && overlay.hash) {
              cfg.url = joinUrls(
                'https://dapplet-api.s3-website.nl-ams.scw.cloud/',
                overlay.hash.replace('0x', '')
              )
              return core.overlay(cfg, eventDef)
            } else {
              throw new Error(`Invalid protocol "${url.protocol}" in the overlay address.`)
            }
          } else {
            return core.overlay(cfg, eventDef)
          }
        },
        wallet: (cfg, eventDef) => core.wallet(cfg, eventDef, manifest.name),
        storage: new AppStorage(manifest, defaultConfig, schemaConfig),
        events: moduleEventBus,
        contract: (type, address, options) => core.contract(type, address, options, manifest.name),
        onAction: (handler: Function) => this.setActionHandler(manifest.name, handler),
        onHome: (handler: Function) => this.setHomeHandler(manifest.name, handler),
        onShareLink: (handler: Function) => this.setShareLinkHandler(manifest.name, handler),
        onWalletsUpdate: (handler: Function) =>
          this.setWalletsUpdateHandler(manifest.name, handler),
        onConnectedAccountsUpdate: (handler: Function) =>
          this.setConnectedAccountsUpdate(manifest.name, handler),
        getManifest: async (
          moduleName?: string
        ): Promise<Omit<ModuleInfo, 'interfaces'> & VersionInfo> => {
          let module: RegistriedModule
          if (moduleName) {
            module = this.registry.find((m) => m.manifest.name === moduleName)
          } else {
            module = this.registry.find((m) => m.manifest.name === manifest.name)
          }
          const { getModuleInfoByName } = await initBGFunctions(browser)
          const registry = manifest.registryUrl
          const moduleInfo: ModuleInfo = await getModuleInfoByName(
            registry,
            moduleName ? moduleName : manifest.name
          )
          return { ...moduleInfo, ...module.manifest, contextIds }
        },
        getContentDetectors: () => core.getContentDetectors(),
        utils: core.utils,
        BigNumber: core.BigNumber,
        ethers: core.ethers,
        near: core.near,
        createShareLink: (targetUrl: string, modulePayload: any) =>
          core.createShareLink(targetUrl, modulePayload, {
            contextIds: ['*'], // ToDo: Replace wildcard on real context IDs
            moduleId: formatModuleId(manifest),
            registry: manifest.registryUrl,
          }),
        sessions: () => core.sessions(manifest.name),
        login: (req, settings) => core.login(req, settings, manifest.name),
        state: core.state,
        connectedAccounts: core.connectedAccounts,
        fetch: core.fetch,
        getPreferredConnectedAccountsNetwork: core.getPreferredConnectedAccountsNetwork,
        notify: async (payload) => {
          // ToDo: do not fetch manifest twice
          const { getModuleInfoByName } = await initBGFunctions(browser)
          const registry = manifest.registryUrl
          const moduleInfo: ModuleInfo = await getModuleInfoByName(registry, manifest.name)
          await core.notify(payload, moduleInfo.icon?.uris?.[0], manifest.name)
        },
      }

      // Built-in modules are loaded without eval
      if (BuiltInModules[manifest.name]) {
        const builtInModule = BuiltInModules[manifest.name]

        // dynamic-adapter is loaded here usually
        this._registerModule(
          builtInModule,
          builtInModule.clazz,
          () => moduleEventBus,
          () => new builtInModule.clazz(coreWrapper)
        )

        continue
      }

      console.log('current module manifest', manifest)
      // ToDo: generalize loading of parser configs
      if (manifest.type === ModuleTypes.ParserConfig && typeof scriptOrConfig === 'object') {
        const dynamicAdapter = this.registry.find(
          (m) => m.manifest.name == 'dynamic-adapter.dapplet-base.eth'
        )
        if (!dynamicAdapter) {
          console.log('error!!!')
          throw new Error('Dynamic adapter is not initialized. Check the order of dependencies.')
        }
        console.log('configWithStyles', scriptOrConfig)
        this._registerModule(
          module,
          ConfigAdapter,
          () => moduleEventBus,
          () => new ConfigAdapter(dynamicAdapter.instance, scriptOrConfig) // ToDo: reuse `scriptOrConfig` property instead of TwitterParserConfig
        )

        continue
      }

      let newBranch: string = null

      // ToDo: describe it

      const injectableDecorator = (constructor) => {
        if (constructor.prototype.getBranch) {
          const resolver: IResolver = new constructor()
          newBranch = resolver.getBranch()
        } else {
          this._registerModule(module, constructor, () => moduleEventBus)
        }
      }

      // ToDo: describe it
      // adapter
      const injectDecorator = (name: string) => {
        if (!name)
          throw new Error(
            'The name of a module is required as the first argument of the @Inject(module_name) decorator'
          )

        return (
          target: any | { constructor: any },
          propertyOrMethodName: string | undefined,
          parameterIndex: number | undefined
        ) => {
          // ToDo: check module_name with manifest
          // ToDo: add module source to error description
          // ContructorDecorator: class, undefined, parameterIndex
          // PropertyDecorator: class(obj), property_name, undefined
          // ParameterDecorator: class(obj), method_name, parameterIndex

          // Built-in module
          if (BuiltInModules[name]) {
            // overlay-adapter is loaded here usually
            this._registerModule(
              BuiltInModules[name],
              BuiltInModules[name].clazz,
              () => new ModuleEventBus(this.eventStream.pipe(filter((e) => e.namespace === name))),
              () => new BuiltInModules[name].clazz()
            )
          }

          // Constructor Parameter Decorator
          if (propertyOrMethodName === undefined) {
            const currentModule = this._registerModule(module, target, () => moduleEventBus)
            currentModule.constructorDependencies[parameterIndex] = name
          }
          // Class Property Decorator
          else if (parameterIndex === undefined) {
            if (delete target[propertyOrMethodName]) {
              Object.defineProperty(target, propertyOrMethodName, {
                get: () => {
                  const currentModule = this.registry.find((m) =>
                    areModulesEqual(m.manifest, manifest)
                  )
                  if (!currentModule.instancedPropertyDependencies[name]) {
                    const depModule = this._getDependency(manifest, name)
                    const instancedModule = this._proxifyModule(depModule, currentModule)
                    currentModule.instancedPropertyDependencies[name] = instancedModule
                  }
                  return currentModule.instancedPropertyDependencies[name]
                },
                enumerable: true,
                configurable: true,
              })
            }
          }
          // Method Parameter Decorator
          else if (propertyOrMethodName === 'activate') {
            const currentModule = this._registerModule(
              module,
              target.constructor,
              () => moduleEventBus
            )
            currentModule.activateMethodsDependencies[parameterIndex] = name
          }
          // Invalid Decorator
          else {
            console.error(
              "Invalid decorator. Inject() decorator can be applied on constructor's parameters, class properties, activate() method's parameters only."
            )
          }
        }
      }

      const onEventDecorator = (type: string) => {
        return function (_, __, descriptor: PropertyDescriptor) {
          moduleEventBus.ofType(type).subscribe(descriptor.value)
          return descriptor
        }
      }

      if (typeof scriptOrConfig === 'string') {
        try {
          const execScript = new Function(
            'Core',
            'Inject',
            'Injectable',
            'OnEvent',
            '__decorate',
            scriptOrConfig
          )
          execScript(
            coreWrapper,
            injectDecorator,
            injectableDecorator,
            onEventDecorator,
            __decorate
          )
        } catch (err) {
          // ToDo: remove module from this.registry
          console.error(err)
          continue
        }
      }

      if (newBranch) {
        const { createNotification } = await initBGFunctions(browser)
        await createNotification({
          title: 'Branch resolving',
          message: `Resolver of "${manifest.name}" defined the "${newBranch}" branch`,
          type: NotificationType.System,
        })
        const missingDependencies = await getModulesWithDeps([
          {
            name: manifest.name,
            branch: newBranch,
            version: 'latest', // ToDo: fix: branch resolver automatically upgrades adapter to the latest version
            contextIds: contextIds,
          },
        ])
        await this._processModules(missingDependencies)
      }
    }
  }

  private async _setContextActivivty(contextIds: any[], parentContext: string, isActive: boolean) {
    if (contextIds.length === 0) return

    if (IS_LIBRARY && DAPPLETS_ORIGINAL_HREF && parentContext === window.location.hostname) {
      try {
        const { hostname } = new URL(DAPPLETS_ORIGINAL_HREF)
        parentContext = hostname
      } catch (_) {}
    }

    contextIds = contextIds
      .map((ctx) => (typeof ctx === 'string' ? ctx : ctx.id))
      .filter((x) => x !== undefined && x !== null)
    contextIds = parentContext ? contextIds.map((ctx) => parentContext + '/' + ctx) : contextIds

    if (isActive) {
      const newContextIds = []
      contextIds.forEach((id) => {
        if (this.availableContextIds.indexOf(id) === -1) {
          this.availableContextIds.push(id)
          newContextIds.push(id)
        }
      })

      if (newContextIds.length > 0) {
        browser.runtime.sendMessage({ type: 'CONTEXT_STARTED', payload: { contextIds } })
        EventBus.emit('context_started', contextIds, { global: false })
      }
    } else {
      const oldContextIds = []
      contextIds.forEach((id) => {
        const index = this.availableContextIds.indexOf(id)
        if (index > -1) {
          this.availableContextIds.splice(index, 1)
          oldContextIds.push(id)
        }
      })

      if (oldContextIds.length > 0) {
        browser.runtime.sendMessage({ type: 'CONTEXT_FINISHED', payload: { contextIds } })
        EventBus.emit('context_finished', contextIds, { global: false })
      }
    }
  }

  private _getDependency(manifest: VersionInfo, name: string) {
    console.log('in _getDependency this.registry', this.registry)
    if (BuiltInModules[name]) {
      return this.registry.find((m) => m.manifest.name == name)
    }

    const dependency = manifest.dependencies[name]
    if (dependency === undefined) {
      console.error(`Module "${name}" doesn't exist in the manifest of "${manifest.name}"`)
      return
    }
    if (valid(dependency as string) === null) {
      console.error(
        `Invalid semver version (${dependency}) of module "${name}" in the manifest of "${manifest.name}"`
      )
      return
    }

    // if the module can not be found by the name, then trying to find its implementation by interface name
    let modules = this.registry.filter((m) => m.manifest.name == name)
    if (modules.length === 0) {
      modules = this.registry.filter((m) => m.manifest.interfaces?.[name] !== undefined)
      if (modules.length === 0) {
        console.error(
          `Can not find neither the module, nor an implementation of the interface "${name}".`
        )
        return null
      }
    }

    // ToDo: Should be moved to the background?
    // ToDo: Fetch prefix from global settings.
    // ToDo: Replace '>=' to '^'
    const prefix = '>=' // https://devhints.io/semver
    const range =
      prefix + (typeof dependency === 'string' ? dependency : dependency[DEFAULT_BRANCH_NAME])
    const maxVer = maxSatisfying(
      modules.map((m) => m.manifest.version),
      range
    )

    const module = modules.find((m) => m.manifest.version == maxVer)
    return module
  }

  private _proxifyModule(proxiedModule: RegistriedModule, contextModule: RegistriedModule) {
    if (proxiedModule.manifest.type === ModuleTypes.Adapter) {
      const cfgsKey = Symbol()
      const featureId = contextModule.manifest.name
      return new Proxy(proxiedModule.instance, {
        get: function (target: IContentAdapter<any>, prop) {
          if (prop === 'attachConfig') {
            return (cfg: any) => {
              if (contextModule.manifest.type === ModuleTypes.Feature) {
                cfg.orderIndex = contextModule.order
                // ToDo: the code below is commented for DAP-3272
                // ToDo: fix context ids adding
                // cfg.contextIds = contextModule.contextIds
                //   .map((id) => {
                //     const [headContextId, ...tailContextId] = id.split('/') // ToDo: check head?
                //     return tailContextId.join('/')
                //   })
                //   .filter((id) => !!id)
              }

              // remember configs to detach it later
              if (!Reflect.has(target, cfgsKey)) {
                Reflect.set(target, cfgsKey, [cfg])
              } else {
                Reflect.get(target, cfgsKey).push(cfg)
              }

              if (BuiltInModules[proxiedModule.manifest.name]) {
                return target.attachConfig(cfg, contextModule)
              } else {
                return target.attachConfig(cfg)
              }
            }
          }
          if (prop === 'detachConfig') {
            return (cfg) => {
              const cfgs = cfg ? [cfg] : Reflect.get(target, cfgsKey)
              cfgs?.forEach((x) => {
                return target.detachConfig(x, featureId)
              })
            }
          }
          if (prop === 'attachFeature') {
            console.error('attachFeature() method is deprecated.')
            return () => null
          }
          if (prop === 'detachFeature') {
            console.error('detachFeature() method is deprecated.')
            return () => null
          }
          if (prop === 'exports') {
            if (typeof target.exports === 'function') {
              return target.exports(featureId)
            } else {
              return target.exports
            }
          } else {
            return target[prop]
          }
        },
      })
    } else {
      return proxiedModule.instance
    }
  }

  private _registerModule(
    module: NotRegisteredModule,
    clazz: any,
    moduleEventBusFactory: () => ModuleEventBus,
    instanceFactory: any = () => null
  ): RegistriedModule {
    const existingModule = this.registry.find((m) => areModulesEqual(m.manifest, module.manifest))

    if (existingModule) {
      return existingModule
    }

    const newRegisteredModule: RegistriedModule = {
      manifest: module.manifest,
      clazz: clazz,
      instance: instanceFactory(),
      order: module.order,
      contextIds: module.contextIds,
      constructorDependencies: [],
      instancedPropertyDependencies: {},
      instancedConstructorDeps: [],
      defaultConfig: module.defaultConfig,
      schemaConfig: module.schemaConfig,
      activateMethodsDependencies: [],
      instancedActivateMethodsDependencies: [],
      moduleEventBus: moduleEventBusFactory(),
    }
    console.log('newRegisteredModule', newRegisteredModule)

    this.registry.push(newRegisteredModule)

    return newRegisteredModule
  }
}
