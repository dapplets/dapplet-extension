import { generateGuid } from './helpers'
import { State } from './state'

type InjectedWidget = {
  widgetId: string
  widgetName: string
  state: State<any>
}

export class ProxyAdapter {
  private _attachedConfig = null
  private _widgets = new Map<string, InjectedWidget>()

  public exports = new Proxy(
    {},
    {
      get: (target, widgetName: string) => {
        // ToDo: implement it
        return (widgetConfig: any) =>
          (context: any): InjectedWidget => ({
            widgetId: generateGuid(),
            widgetName,
            state: new State(widgetConfig, context, () => 'LIGHT'), // ToDo: light
          })
      },
    }
  )

  constructor(public adapterName: string) {
    global.addEventListener('message', this._messageListener)
  }

  public attachConfig(config: any) {
    console.log(config)
    // ToDo: implement it
    this._attachedConfig = config

    const listeningContexts = Object.keys(config)

    this._notify('config-attached', { listeningContexts, adapterName: this.adapterName })
  }

  public detachConfig() {
    // ToDo: implement it
    this._attachedConfig = null
  }

  private _onContextStarted({ ctx, contextName }: { ctx: any; contextName: string }) {
    const widgetFactories = this._attachedConfig[contextName](ctx)
    widgetFactories
      .map((x) => x(ctx))
      .forEach((x: InjectedWidget) => {
        this._widgets.set(x.widgetId, x)
        this._notify('widget-created', {
          widgetId: x.widgetId,
          widgetName: x.widgetName,
          stateValues: x.state.getStateValues(),
        })
      })
  }

  private _notify(method: string, ...params: any[]) {
    global.postMessage({ method, params })
  }

  private _messageListener = (e: MessageEvent) => {
    // ToDo: filter notifications from another adapters
    switch (e.data.method) {
      case 'context-started':
        this._onContextStarted(e.data.params[0])
        break
      default:
        console.warn(`SandboxExecutor: Unknown method ${e.data.method}`)
    }
  }
}
