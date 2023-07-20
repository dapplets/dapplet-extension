import { generateGuid } from './helpers'
import { State } from './state'

type InjectedWidget = {
  widgetId: string
  widgetName: string
  state: State<any>
}

export class ProxyAdapter {
  private _widgets = new Map<string, InjectedWidget>()
  private _configById = new Map<string, any>()

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
    const configId = generateGuid()
    const listeningContexts = Object.keys(config)
    this._configById.set(configId, config)

    this._notify('config-attached', {
      configId,
      listeningContexts,
      adapterName: this.adapterName,
    })

    return {
      $: (ctx: any, id: string) => {
        for (const widget of this._widgets.values()) {
          // ToDo: coliision with another context types are possible
          if (widget.state.id === id && widget.state.ctx.id === ctx.id) {
            return widget
          }
        }

        return null
      },
      reset: () => {
        this.detachConfig(config)
      },
    }
  }

  public detachConfig(detachingConfig?: any) {
    // if config is not passed, detach all configs
    if (detachingConfig) {
      // ToDo: rewrite with for of
      this._configById.forEach((config, configId) => {
        if (config === detachingConfig) {
          this._notify('config-detached', { configId })
          this._configById.delete(configId)
        }
      })
    } else {
      const configIds = Array.from(this._configById.keys())
      configIds.forEach((configId) => {
        this._notify('config-detached', { configId })
      })
      this._configById.clear()
    }
  }

  private async _getWidgetsForContext({
    configId,
    ctx,
    contextName,
  }: {
    configId: string
    ctx: any
    contextName: string
  }) {
    if (!this._configById.has(configId)) return []

    const unknownFactories = this._configById.get(configId)[contextName](ctx) ?? []
    const widgetFactories = Array.isArray(unknownFactories) ? unknownFactories : [unknownFactories]
    const widgetsToBeCreated = await Promise.all(
      widgetFactories.map(async (widgetFactory) => {
        if (widgetFactory instanceof Promise) {
          widgetFactory = await widgetFactory
        }

        if (!widgetFactory) return null

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
    return widgetsToBeCreated.filter((x) => !!x)
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