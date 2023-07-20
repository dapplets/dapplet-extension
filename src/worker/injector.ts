import { Core } from './core'
import { ProxyAdapter } from './proxyAdapter'

type DappletConfig = {
  [contextName: string]: (context: any) => any[]
}

interface ModuleConstructor {
  new (...modules: ModuleInterface[]): ModuleInterface
}

interface ModuleInterface {
  activate?(...modules: ModuleInterface[]): Promise<void>
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

// ToDo: below is injecting dependencies with decorators, but it's not elegant
// Read this topic and refactor the code: https://stackoverflow.com/q/61439271

/**
 * @singleton
 */
export class Injector {
  private _registry: RegistriedModule[] = []
  private _constructorDeps: string[] = [] // ToDo: find a better way to inject dependencies
  private _activateMethodsDeps: string[] = [] // ToDo: find a better way to inject dependencies
  private _deactivateCallbacks: (() => void)[] = [] // ToDo: come up with a new way to unsubscribe

  constructor(private core: Core) {}

  public async activate() {
    const mainModule = this._registry.find((x) => x.name === MAIN_MODULE_NAME)
    if (!mainModule) throw new Error('Main module is not found')
    if (mainModule.instance) throw new Error('Main module is already activated')

    const instancedConstructorDeps = this._constructorDeps.map(this._getDependencyInstance)
    mainModule.instance = new mainModule.clazz(...instancedConstructorDeps)

    if (mainModule.instance.activate) {
      const instancedActivateMethodDeps = this._activateMethodsDeps.map(this._getDependencyInstance)
      await mainModule.instance.activate(...instancedActivateMethodDeps)
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

    // unsubscribe all event listeners
    this._deactivateCallbacks.forEach((x) => x())
    this._deactivateCallbacks = []

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
        this._constructorDeps[parameterIndex] = name
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
        this._activateMethodsDeps[parameterIndex] = name
      }
      // Invalid Decorator
      else {
        console.error(
          "Invalid decorator. Inject() decorator can be applied on constructor's parameters, class properties, activate() method's parameters only."
        )
      }
    }
  }

  public onEventDecorator(eventType: string) {
    if (!eventType) {
      throw new Error(
        'Event type is required as the first argument of the @OnEvent(event_type) decorator'
      )
    }

    return (_, __, descriptor: PropertyDescriptor) => {
      if (!descriptor || typeof descriptor.value !== 'function') {
        throw new Error('OnEvent() decorator can be applied on class methods only.')
      }

      const subscription = this.core.events.ofType(eventType).subscribe((event) => {
        // ToDo: replace with a more elegant solution
        const mainModule = this._registry.find((x) => x.name === MAIN_MODULE_NAME)
        if (!mainModule) throw new Error('Main module is not found')
        descriptor.value.call(mainModule.instance, event)
      })

      this._deactivateCallbacks.push(subscription.unsubscribe.bind(subscription))

      return descriptor
    }
  }

  private _getDependencyInstance = (name: string) => {
    if (!name) throw new Error('The name of a module is required')

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
