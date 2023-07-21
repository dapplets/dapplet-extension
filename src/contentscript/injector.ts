import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { Subject } from 'rxjs'
import { filter } from 'rxjs/operators'
import { maxSatisfying, valid } from 'semver'
import browser from 'webextension-polyfill'
import VersionInfo from '../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD, DEFAULT_BRANCH_NAME, ModuleTypes } from '../common/constants'
import * as EventBus from '../common/global-event-bus'
import { areModulesEqual, multipleReplace, parseModuleName } from '../common/helpers'
import { JsonRpc } from '../common/jsonrpc'
import {
  BaseEvent,
  DefaultConfig,
  ParserConfig,
  SandboxInitializationParams,
  SchemaConfig,
} from '../common/types'
import Core from './core'
import BuiltInModules from './modules'
import { ConfigAdapter } from './modules/config-adapter'
import { DynamicAdapter } from './modules/dynamic-adapter'
import { DappletExecutor } from './sandbox/dappletExecutor'
import { IFrameContainer } from './sandbox/iframeContainer'
import { IContentAdapter } from './types'

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
const IS_LIBRARY = typeof window !== 'undefined' && window['DAPPLETS_JSLIB'] === true

export class Injector {
  public availableContextIds: string[] = []
  public registry: RegistriedModule[] = []

  private _dynamicAdapter: DynamicAdapter<any>
  private _iframeContainer = new IFrameContainer()

  constructor(
    public core: Core,
    private eventStream: Subject<BaseEvent>,
    private jsonrpc: JsonRpc,
    private env?: { shareLinkPayload: { moduleId: string; payload: any; isAllOk: boolean } }
  ) {
    this._setContextActivivty(
      [new URL(DAPPLETS_ORIGINAL_HREF ?? window.location.href).hostname],
      undefined,
      true
    )
    window.exports = {} // for CommonJS modules compatibility
    this._dynamicAdapter = new DynamicAdapter(this.core)
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

        let loadingResult = null
        m.instance = new m.clazz(...m.instancedConstructorDeps)
        if (m.instance.activate !== undefined) {
          if (typeof m.instance.activate === 'function') {
            // ToDo: activate modules in parallel
            loadingResult = await m.instance.activate(...m.instancedActivateMethodsDependencies)
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
            runtime: loadingResult.runtime,
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
    module?.instance?.onActionHandler?.() // ToDo: unify event dispatching
  }

  public async openDappletHome(moduleName: string) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    if (!module || !module.instance) throw Error('The dapplet is not activated.')
    module.onHomeHandler?.()
    module?.instance?.onHomeHandler?.() // ToDo: unify event dispatching
  }

  public async sendShareLinkData(moduleName: string, data: any) {
    const module = this.registry.find((m) => m.manifest.name === moduleName)
    if (!module || !module.instance) throw Error('The dapplet is not activated.')
    module.onShareLinkHandler?.(data)
    module?.instance?.onShareLinkHandler?.(data) // ToDo: unify event dispatching
  }

  public async executeWalletsUpdateHandler() {
    this.registry.find((m) => {
      m.onWalletsUpdateHandler?.()
      m?.instance?.onWalletsUpdateHandler?.() // ToDo: unify event dispatching
    })
  }

  public async executeConnectedAccountsUpdateHandler() {
    this.registry.find((m) => {
      m.onConnectedAccountsUpdateHandler?.()
      m?.instance?.onConnectedAccountsUpdateHandler?.() // ToDo: unify event dispatching
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
    this._iframeContainer.destroy()
  }

  private async _processModules(modules: NotRegisteredModule[]) {
    const { getSwarmGateway, getPreferedOverlayStorage } = await initBGFunctions(browser)

    const swarmGatewayUrl = await getSwarmGateway()
    const preferedOverlayStorage = await getPreferedOverlayStorage()
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

      // ToDo: generalize loading of parser configs
      if (manifest.type === ModuleTypes.ParserConfig) {
        if (typeof scriptOrConfig !== 'object') {
          throw new Error('SCRIPT should be parsed in the background!')
        }

        this._registerModule(
          module,
          ConfigAdapter,
          () => new ConfigAdapter(this._dynamicAdapter, scriptOrConfig)
        )

        continue
      }

      try {
        if (typeof scriptOrConfig !== 'string') {
          throw new Error("Module doesn't have an executable script")
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const me = this
        const initParams: SandboxInitializationParams = {
          manifest,
          defaultConfig,
          schemaConfig,
          env: {
            swarmGatewayUrl,
            preferedOverlayStorage,
          },
        }

        // ToDo: refactor it
        const DappletExecutorExtended = class extends DappletExecutor {
          constructor() {
            const observable = me.eventStream.pipe(filter((e) => e.namespace === manifest.name))
            super(me._iframeContainer, scriptOrConfig as string, initParams, me.jsonrpc, observable)
          }

          // implementaion of the abstract method
          public getDependency(name: string) {
            const currentModule = me.registry.find((m) => areModulesEqual(m.manifest, manifest))
            const depModule = me._getDependency(manifest, name)
            const instancedModule = me._proxifyModule(depModule, currentModule)
            return instancedModule
          }
        }

        this._registerModule(module, DappletExecutorExtended)
      } catch (err) {
        // ToDo: remove module from this.registry
        console.error(err)
        continue
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
    if (BuiltInModules[name]) {
      if (this.registry.some((m) => m.manifest.name == name)) {
        return this.registry.find((m) => m.manifest.name == name)
      } else {
        return this._registerModule(
          BuiltInModules[name],
          BuiltInModules[name].clazz,
          () => new BuiltInModules[name].clazz()
        )
      }
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
    if (
      proxiedModule.manifest.type === ModuleTypes.Adapter ||
      proxiedModule.manifest.type === ModuleTypes.ParserConfig
    ) {
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
    }
    this.registry.push(newRegisteredModule)
    return newRegisteredModule
  }
}
