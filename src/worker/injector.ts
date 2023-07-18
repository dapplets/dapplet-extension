import { Core } from './core'
import { ProxyAdapter } from './proxyAdapter'

type DappletConfig = {
  [contextName: string]: (context: any) => any[]
}

interface ModuleConstructor {
  new (): ModuleInterface
}

interface ModuleInterface {
  activate?(): Promise<void>
  deactivate?(): Promise<void>
  attachConfig?(config: DappletConfig): void
  detachConfig?(config: DappletConfig): void
}

type RegistriedModule = {
  name: string
  clazz: ModuleConstructor
  instance: ModuleInterface | null
}

const MAIN_MODULE_NAME = 'dapplet'

/**
 * @singleton
 */
export class Injector {
  private _registry: RegistriedModule[] = []

  constructor(private core: Core) {}

  public async activate() {
    const mainModule = this._registry.find((x) => x.name === MAIN_MODULE_NAME)
    if (!mainModule) throw new Error('Main module is not found')
    if (mainModule.instance) throw new Error('Main module is already activated')

    mainModule.instance = new mainModule.clazz()

    if (mainModule.instance.activate) {
      await mainModule.instance.activate()
    }

    return {
      runtime: {
        isActionHandler: !!this.core.actionListener,
        isHomeHandler: !!this.core.homeListener,
      },
    }
  }

  public async deactivate() {
    const mainModule = this._registry.find((x) => x.name === MAIN_MODULE_NAME)
    if (!mainModule) throw new Error('Main module is not found')
    if (!mainModule.instance) throw new Error('Main module is not activated')

    if (mainModule.instance.deactivate) {
      await mainModule.instance.deactivate()
    }

    mainModule.instance = null
  }

  public injectableDecorator(constructor: ModuleConstructor) {
    // ToDo: generalize for all modules
    this._registry.push({ name: MAIN_MODULE_NAME, clazz: constructor, instance: null })
  }

  public injectDecorator(name: string) {
    if (!name)
      throw new Error(
        'The name of a module is required as the first argument of the @Inject(module_name) decorator'
      )

    return (
      target: ModuleInterface | { constructor: ModuleConstructor },
      propertyOrMethodName: string | undefined,
      parameterIndex: number | undefined
    ) => {
      // Constructor Parameter Decorator
      if (propertyOrMethodName === undefined) {
        console.error('Constructor Parameter Decorator is not implemented yet.')
        // const currentModule = this._registerModule(module, target, () => moduleEventBus)
        // currentModule.constructorDependencies[parameterIndex] = name
      }
      // Class Property Decorator
      else if (parameterIndex === undefined) {
        if (delete target[propertyOrMethodName]) {
          Object.defineProperty(target, propertyOrMethodName, {
            get: () => this._getDependencyInstance(name),
            enumerable: true,
            configurable: true,
          })
        }
      }
      // Method Parameter Decorator
      else if (propertyOrMethodName === 'activate') {
        console.error('Method Parameter Decorator is not implemented yet.')
        // const currentModule = this._registerModule(module, target.constructor, () => moduleEventBus)
        // currentModule.activateMethodsDependencies[parameterIndex] = name
      }
      // Invalid Decorator
      else {
        console.error(
          "Invalid decorator. Inject() decorator can be applied on constructor's parameters, class properties, activate() method's parameters only."
        )
      }
    }
  }

  private _getDependencyInstance(name: string) {
    let module = this._registry.find((x) => x.name === name)

    if (!module) {
      const ExtendedProxyAdapter = class extends ProxyAdapter {
        constructor() {
          super(name)
        }
      }

      module = {
        name,
        clazz: ExtendedProxyAdapter,
        instance: new ExtendedProxyAdapter(),
      }

      this._registry.push(module)
    }

    return module.instance
  }
}
