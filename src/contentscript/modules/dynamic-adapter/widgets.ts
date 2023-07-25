import Core from '../../core'
import { Context, DappletConfig, IWidgetBuilderConfig } from './types'

// interface IConfig {
//   orderIndex: number
//   ['string']: (ctx: string) => any[] | any
// }

export class WidgetBuilder {
  contextName: string
  containerSelector: string
  contextSelector: string
  insPoints: { [key: string]: any }
  events: { [key: string]: (node: any, ctx: any, emitter: Function, on?: Function) => void }
  contextBuilder: (node: any, parent: any) => any
  observer: MutationObserver = null
  eventHandler: (event: string, args: any[], target: any) => void = null
  theme: undefined | (() => string) = null
  childrenContexts: string[] | null = null

  private executedNodes = new WeakMap<Node, WeakSet<any>>()
  private widgetsByContextId = new Map<string, Set<any>>()
  private widgets = new Map<DappletConfig, any[]>()
  public contexts = new WeakMap<Node, Context>() // ToDo: make private

  //ToDo: widgets

  constructor(
    public readonly adapterName: string,
    contextName: string,
    widgetBuilderConfig: IWidgetBuilderConfig,
    private _core: Core
  ) {
    Object.assign(this, widgetBuilderConfig)
    this.contextName = contextName
  }

  public emitEvent(targetCtx: any, event: string, context: Context, args: any[]) {
    this.eventHandler?.(event, args, targetCtx)
    context.eventHandlers[event]?.forEach((h) => h(...args))
  }

  // `updateContexts()` is called when new context is found.
  public updateContexts(
    dappletConfigs: DappletConfig[],
    container: Element,
    widgetBuilders: WidgetBuilder[],
    parentContext: any
  ) {
    const contextNodes = this.contextSelector
      ? Array.from(container?.querySelectorAll(this.contextSelector) || [])
      : [container]
    if (contextNodes.length === 0) return

    const newParsedContexts = []
    const newFeatureConfigs = []

    for (const contextNode of contextNodes) {
      const isNewContext = !this.contexts.has(contextNode)
      const context: Context = isNewContext
        ? {
            parsed: this._tryParseContext(contextNode, parentContext, widgetBuilders),
            eventHandlers: {},
          }
        : this.contexts.get(contextNode)

      if (!context.parsed) continue

      // ToDo: refactor isNew checking
      if (isNewContext) {
        newParsedContexts.push(context)
      } else {
        const newContext = this._tryParseContext(contextNode, parentContext, widgetBuilders)

        if (!newContext) {
          const oldId = this.contexts.get(contextNode).parsed.id
          this.contexts.delete(contextNode)
          this.executedNodes.delete(contextNode)
          this.widgetsByContextId.get(oldId)?.forEach((x) => x.unmount())
          continue
        }

        if (!this._compareObjects(context.parsed, newContext)) {
          if (newContext.id !== context.parsed.id) {
            // ToDo: think about a neccessary of calling this.contexts.delete(contextNode)
            this.executedNodes.delete(contextNode)
            this.widgetsByContextId.get(context.parsed.id)?.forEach((x) => x.unmount())
          }

          const oldContext = Object.assign({}, context.parsed)
          Object.assign(context.parsed, newContext) // Refreshing of context without link destroying
          this.emitEvent(null, 'context_changed', context, [
            null,
            newContext,
            oldContext,
            this.contextName,
          ])
        }
      }

      if (isNewContext) {
        this.contexts.set(contextNode, context)
        for (const event in this.events) {
          const emitHandler = (targetCtx, ...args) =>
            this.emitEvent(targetCtx, event, context, args)
          const onHandler = (event, handler) => {
            if (!context.eventHandlers[event]) context.eventHandlers[event] = []
            context.eventHandlers[event].push(handler)
          }
          this.events[event].apply(this, [contextNode, context.parsed, emitHandler, onHandler])
        }
      }

      for (const dappletConfig of dappletConfigs) {
        // Prevent multiple execution of dappletConfig on one context
        if (!this.executedNodes.has(contextNode)) this.executedNodes.set(contextNode, new WeakSet())
        if (this.executedNodes.get(contextNode).has(dappletConfig)) continue
        this.executedNodes.get(contextNode).add(dappletConfig)

        // is new feature?
        if (this.widgets.get(dappletConfig) === undefined) {
          this.widgets.set(dappletConfig, [])
          newFeatureConfigs.push(dappletConfig)
        }

        if (dappletConfig[this.contextName] === undefined) continue

        const insPointConfig = dappletConfig[this.contextName]

        if (Array.isArray(insPointConfig)) {
          this._insertWidgets(insPointConfig, dappletConfig, this.contextName, context, contextNode)
        } else if (typeof insPointConfig === 'function') {
          const arr = insPointConfig(context.parsed)
          const insert = (arr) =>
            this._insertWidgets(arr, dappletConfig, this.contextName, context, contextNode)
          arr instanceof Promise ? arr.then(insert) : insert(arr)
        } else {
          dappletConfig[this.contextName] = undefined
          console.error(
            `Invalid configuration of "${this.contextName}" insertion point. It must be an array of widgets or function.`
          )
        }

        for (const childrenContext of this.childrenContexts ?? []) {
          const wb = widgetBuilders.find((x) => x.contextName === childrenContext)
          for (const contextName in dappletConfig) {
            if (contextName !== this.contextName) continue

            const fn = dappletConfig[contextName]
            if (typeof fn !== 'function') continue

            const widgets = fn(context.parsed)
            const insert = (widgets: any[] | any) => {
              ;(Array.isArray(widgets) ? widgets : [widgets])
                .filter((widget) => !Array.isArray(widget) && typeof widget === 'object')
                .forEach((configsWrapper) => {
                  Object.entries(configsWrapper).forEach(([key, value]) => {
                    if (childrenContext === key) {
                      dappletConfig[key] = value // ToDo: [POTENTIAL BUG] unclear consequences of overwriting configurations of child contexts
                      wb.updateContexts(
                        [dappletConfig],
                        contextNode,
                        widgetBuilders,
                        context.parsed
                      )
                    }
                  })
                })
            }
            widgets instanceof Promise ? widgets.then(insert) : insert(widgets)
          }
        }
      }
    } // end loop

    this._core.contextStarted(
      newParsedContexts.map((ctx) => ctx.parsed),
      document.location.hostname
    )
    newParsedContexts.forEach((ctx) =>
      this.emitEvent(null, 'context_changed', ctx, [null, ctx.parsed, null, this.contextName])
    )

    const allContexts = contextNodes.map((cn) => this.contexts.get(cn)).filter((cn) => !!cn)
    newFeatureConfigs.forEach((fc) =>
      allContexts.forEach(
        (ctx) =>
          newParsedContexts.indexOf(ctx) === -1 &&
          this.emitEvent(fc, 'context_changed', ctx, [fc, ctx.parsed, null, this.contextName])
      )
    )

    return newParsedContexts
  }

  public findWidget(config: DappletConfig, ctx: any, id: any) {
    const widgets = this.widgets.get(config)
    if (!widgets) return null

    const widget = widgets.find((x) => x.state.ctx === ctx && x.state.id === id)
    if (!widget) return null

    return widget.state
  }

  public unmountWidgets(config: DappletConfig) {
    const widgets = this.widgets.get(config)
    if (!widgets || widgets.length === 0) return
    widgets.forEach((w) => w.unmount())
    const container = document.querySelector(this.containerSelector)
    const contextNodes = this.contextSelector
      ? Array.from(container?.querySelectorAll(this.contextSelector) || [])
      : [container]
    if (contextNodes.length === 0) return
    for (const contextNode of contextNodes) {
      if (this.executedNodes.get(contextNode)?.has(config)) {
        this.executedNodes.get(contextNode).delete(config)
      }
    }
  }

  private _insertWidgets(
    insPointConfig: any,
    dappletConfig: DappletConfig,
    insPointName: string,
    context: Context,
    contextNode: Element
  ) {
    if (insPointConfig === null || insPointConfig === undefined) return

    const widgetConstructors = Array.isArray(insPointConfig) ? insPointConfig : [insPointConfig]

    for (const widgetConstructor of widgetConstructors) {
      // ToDo: remove the following condition. Since the extension v0.54.1, contextIds are not defined.
      // This contextIds are defined by Injector of the extension
      const contextIds = dappletConfig.contextIds || []

      if (contextIds.length === 0 || contextIds.indexOf(context.parsed.id) !== -1) {
        if (typeof widgetConstructor !== 'function') {
          // console.error(`Invalid widget configuration in the insertion point "${insPointName}". It must be WidgetConstructor instance.`);
          continue
        }
        const insertedWidget = widgetConstructor(
          this,
          insPointName,
          dappletConfig.orderIndex,
          contextNode
        )
        if (!insertedWidget) continue

        const registeredWidgets = this.widgets.get(dappletConfig)
        registeredWidgets.push(insertedWidget)
        this.widgets.set(dappletConfig, registeredWidgets)

        if (context.parsed.id !== undefined) {
          if (!this.widgetsByContextId.has(context.parsed.id))
            this.widgetsByContextId.set(context.parsed.id, new Set<any>())
          if (!this.widgetsByContextId.get(context.parsed.id).has(insertedWidget))
            this.widgetsByContextId.get(context.parsed.id).add(insertedWidget)
        }
      }
    }
  }

  private _compareObjects(a: any, b: any) {
    for (const key in a) {
      if (a[key] !== b[key]) return false
    }
    return true
  }

  private _tryParseContext(el: Element, _parent: any, widgetBuilders: WidgetBuilder[]) {
    try {
      const parent = this._getParentContextByElement(el, widgetBuilders) ?? _parent
      const ctx = this.contextBuilder(el, parent)
      if (!ctx) return null
      ctx.parent = parent
      return ctx
    } catch (err) {
      // ToDo: what need to do in this cases?
      console.warn(`Cannot parse context "${this.contextName}"`, err)
      return null
    }
  }

  private _getParentContextByElement(el: Element, widgetBuilders: WidgetBuilder[]): any {
    let currentEl = el

    while (currentEl.parentElement) {
      for (const cb of widgetBuilders) {
        const parentCtx = cb.contexts.get(currentEl.parentElement)
        if (parentCtx) return parentCtx.parsed
      }
      currentEl = currentEl.parentElement
    }

    return null
  }
}
