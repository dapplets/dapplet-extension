import { generateGuid } from '../common/generateGuid'
import { State } from './state'

type InjectedWidget = {
  widgetId: string
  widgetName: string
  state: State<any>
}

export class ProxyAdapter {
  private _widgets = new Map<string, InjectedWidget>()
  private _configById = new Map<string, any>()
  private _contextByTypeAndId = new Map<string, Map<string, any>>()

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
            state.changedHandler = (newValuesUnsafe) => {
              // Remove unserializable values
              const newValues = JSON.parse(JSON.stringify(newValuesUnsafe))
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
            return widget.state.state
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

    ctx = this._saveOrUpdateContext(contextName, ctx)

    let unknownFactories = this._configById.get(configId)[contextName](ctx) ?? []

    if (unknownFactories instanceof Promise) {
      unknownFactories = await unknownFactories
    }

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

  private _onContextChanged({
    newContext,
    // oldContext,
    contextName,
  }: {
    newContext: any
    oldContext: any
    contextName: string
  }) {
    if (!newContext) return
    this._saveOrUpdateContext(contextName, newContext)
  }

  private _saveOrUpdateContext(contextName: string, ctx: any) {
    if (!this._contextByTypeAndId.has(contextName)) {
      this._contextByTypeAndId.set(contextName, new Map([[ctx.id, ctx]]))
      return ctx
    } else if (!this._contextByTypeAndId.get(contextName).has(ctx.id)) {
      this._contextByTypeAndId.get(contextName).set(ctx.id, ctx)
      return ctx
    } else {
      // update context
      return Object.assign(this._contextByTypeAndId.get(contextName).get(ctx.id), ctx)
    }
  }

  private _notify(method: string, ...params: any[]) {
    global.postMessage({ method, params })
  }

  private _messageListener = (e: MessageEvent) => {
    const { id, method, params } = e.data

    if (!params) return

    // ToDo: filter notifications from another adapters more elegant
    if (params[0].adapterName !== this.adapterName) return

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
      case 'context-changed':
        this._onContextChanged(params[0])
        break
      default:
        console.warn(`ProxyAdapter: Unknown method ${method}`)
    }
  }
}
