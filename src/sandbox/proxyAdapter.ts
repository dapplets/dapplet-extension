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
        return (widgetConfig: any) => {
          return (context: any): InjectedWidget => {
            const widgetId = generateGuid()
            const state = new State(widgetConfig, context, () => 'LIGHT') // ToDo: light

            // ToDo: unsubscribe
            state.changedHandler = (newValues) => {
              this._notify('state-updated', { widgetId, newValues })
            }

            return {
              widgetId,
              widgetName,
              state,
            }
          }
        }
      },
    }
  )

  constructor(public adapterName: string) {
    global.addEventListener('message', this._messageListener)
  }

  public attachConfig(config: any) {
    // ToDo: implement multiple configs
    this._attachedConfig = config

    const listeningContexts = Object.keys(config)

    this._notify('config-attached', { listeningContexts, adapterName: this.adapterName })

    return {
      $: (ctx: any, id: string) => {
        for (const widget of this._widgets.values()) {
          if (widget.state.id === id && widget.state.ctx === ctx) {
            return widget
          }
        }

        return null
      },
      reset: () => {
        // ToDo: implement it
        throw new Error('Not implemented yet')
      },
    }
  }

  public detachConfig() {
    // ToDo: implement it
    this._attachedConfig = null
  }

  private async _getWidgetsForContext({ ctx, contextName }: { ctx: any; contextName: string }) {
    const widgetFactories = this._attachedConfig[contextName](ctx) ?? []
    const widgetsToBeCreated = Promise.all(
      widgetFactories.map(async (widgetFactory) => {
        const widget: InjectedWidget = await widgetFactory(ctx)
        widget.state.state.init?.(ctx, widget.state.state) // ToDo: can be buggy when widgetFactory returns value asynchronously
        this._widgets.set(widget.widgetId, widget)
        const stateValues = widget.state.getStateValues()

        // ToDo: it will not work for imperative defined callbacks
        const listeningEvents = Object.entries(stateValues)
          .filter(([, v]) => typeof v === 'function')
          .map(([k]) => k)

        return {
          widgetId: widget.widgetId,
          widgetName: widget.widgetName,
          listeningEvents,
          // contextName,
          // contextId: ctx.id,
          stateValues: JSON.parse(JSON.stringify(stateValues)), // remove callbacks and another references
        }
      })
    )
    return widgetsToBeCreated
  }

  private _onWidgetEvent({
    widgetId,
    eventName,
    data,
  }: {
    widgetId: string
    eventName: string
    data: any
  }) {
    const widget = this._widgets.get(widgetId)
    if (!widget) {
      console.error('ProxyAdapter: Widget not found for widgetId ' + widgetId)
      return
    }

    const callback = widget.state.state[eventName]
    if (!callback) return

    callback(data, widget.state.state)
  }

  private _notify(method: string, ...params: any[]) {
    global.postMessage({ method, params })
  }

  private _messageListener = (e: MessageEvent) => {
    const { id, method, params } = e.data

    // ToDo: filter notifications from another adapters
    switch (method) {
      case 'get-widgets-for-context':
        this._getWidgetsForContext(params[0])
          .then((result) => {
            global.postMessage({ id, result })
          })
          .catch((error) => {
            global.postMessage({ id, error })
          })
        break
      case 'widget-event':
        this._onWidgetEvent(params[0])
        break
      default:
        console.warn(`ProxyAdapter: Unknown method ${method}`)
    }
  }
}
