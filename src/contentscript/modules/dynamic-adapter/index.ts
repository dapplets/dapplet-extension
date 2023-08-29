// Polyfill for WebComponents that doesn't work in an Extension's JS-context
import { unsafeCSS } from 'lit'
import { State, WidgetConfig } from '../../../common/state'
import Core from '../../core'
import { IContentAdapter } from '../../types'
import { Locator } from './locator'
import { Context, DappletConfig, IWidget, IWidgetBuilderConfig } from './types'
import { WidgetBuilder } from './widgets'

function composeTestId(ctxName: string, ctxId: string, widgetId: string): string {
  if (ctxName && ctxId && widgetId) {
    return `${ctxName}/${ctxId}/${widgetId}`
  } else {
    return null
  }
}

export interface IDynamicAdapter extends IContentAdapter {
  configure(config: { [contextName: string]: IWidgetBuilderConfig }, adapterName: string): void
  createWidgetFactory<T>(
    Widget: any
  ): (config: {
    [state: string]: T
  }) => (builder: WidgetBuilder, insPointName: string, order: number, contextNode: Element) => any
  resetConfig(
    config: DappletConfig,
    newConfig: DappletConfig,
    adapterName: string
  ): {
    $: (ctx: any, id: string) => any
  }
}

type DappletConfigEnvelope = {
  adapterName: string
  config: DappletConfig
}

export class DynamicAdapter implements IDynamicAdapter {
  private observer: MutationObserver = null
  private dappletConfigEnvelopes: DappletConfigEnvelope[] = []
  private contextBuilders: WidgetBuilder[] = []
  private stateStorage = new Map<string, State<any>>()
  private locator: Locator

  constructor(private _core: Core) {
    if (!document || !window || !MutationObserver)
      throw Error('Document or MutationObserver is not available.')

    this.locator = new Locator(this._core)
    this.locator.scanDocument() // find all dynamic contexts in a document
    this.observer = new MutationObserver((mutations) => this.updateObservers(mutations))
    this.observer.observe(document.body, { childList: true, subtree: true, attributes: true })
  }

  // Config from dapplet
  public attachConfig(config: DappletConfig, adapterName: string) {
    // ToDo: automate two-way dependency handling(?)
    if (this.dappletConfigEnvelopes.find((f) => f.config === config)) return

    this.dappletConfigEnvelopes.splice(config['orderIndex'], 0, { config, adapterName })
    this.updateObservers()

    return {
      $: (ctx: any, id: string) => {
        for (const wb of this.contextBuilders) {
          const widget = wb.findWidget(config, ctx, id)
          if (widget) return widget
        }

        return null
      },
      reset: (newConfig?: DappletConfig) => this.resetConfig(config, newConfig, adapterName),
    }
  }

  // Config from dapplet
  public detachConfig(config: DappletConfig) {
    this.dappletConfigEnvelopes = this.dappletConfigEnvelopes.filter((f) => f.config !== config)
    this.contextBuilders.forEach((wb) => wb.unmountWidgets(config))
    // ToDo: close all subscriptions and connections
  }

  // Config from dapplet
  public resetConfig(
    config: DappletConfig,
    newConfig: DappletConfig | undefined,
    adapterName: string
  ) {
    this.detachConfig(config)
    return this.attachConfig(newConfig ?? config, adapterName)
  }

  // Config from adapter
  public configure(
    config: { [contextName: string]: IWidgetBuilderConfig },
    adapterName: string
  ): void {
    console.warn('MV2 Adapters are deprecated. Please use MV3 Adapters.')

    const builders = Object.entries(config).map(([contextName, cfg]) => {
      const builder = new WidgetBuilder(adapterName, contextName, cfg, this._core)
      builder.eventHandler = (event, args, targetCtx) => {
        if (targetCtx) {
          this.dappletConfigEnvelopes.forEach((envelope) =>
            envelope.config?.events?.[event]?.(targetCtx, ...args)
          )
        } else {
          this.dappletConfigEnvelopes.forEach((envelope) =>
            envelope.config?.events?.[event]?.(...args)
          )
        }
      }

      return builder
    })

    this.contextBuilders.push(...builders)
    this.updateObservers()
  }

  private updateObservers(mutations?: MutationRecord[]) {
    this.contextBuilders
      .filter(
        (contextBuilder) =>
          !this.contextBuilders.find((anyContextBuilder) =>
            anyContextBuilder.childrenContexts?.includes(contextBuilder.contextName)
          )
      )
      .forEach((contextBuilder) => {
        const container = document.querySelector(contextBuilder.containerSelector)
        if (container) {
          // destroy contexts to removed nodes
          const removedContexts: Context[] = []
          mutations?.forEach((m) =>
            Array.from(m.removedNodes)
              .filter((n: Element) => n.nodeType == Node.ELEMENT_NODE)
              .forEach((n: Element) => {
                const contextNodes = contextBuilder.contextSelector
                  ? Array.from(n?.querySelectorAll(contextBuilder.contextSelector) || [])
                  : [n]
                const contexts = contextNodes
                  .map((n: Element) => contextBuilder.contexts.get(n))
                  .filter((e) => e)
                removedContexts.push(...contexts)
              })
          )
          if (removedContexts && removedContexts.length > 0) {
            this._core.contextFinished(removedContexts.map((c) => c.parsed))
            removedContexts.forEach((ctx) =>
              contextBuilder.emitEvent(null, 'context_changed', ctx, [
                null,
                null,
                ctx.parsed,
                contextBuilder.contextName,
              ])
            )
          }
          contextBuilder.updateContexts(
            this._getDappletConfigsForAdapter(contextBuilder.adapterName),
            container,
            this.contextBuilders,
            null
          ) // ToDo: think about it
        }
        // a new container was opened, no observer attached yet
        if (container && !contextBuilder.observer) {
          contextBuilder.observer = new MutationObserver(() => {
            contextBuilder.updateContexts(
              this._getDappletConfigsForAdapter(contextBuilder.adapterName),
              container,
              this.contextBuilders,
              null
            )
          })
          contextBuilder.observer.observe(container, {
            childList: true,
            subtree: true,
          })
        } else if (!container && contextBuilder.observer) {
          // a container was destroyed, disconnect observer too
          contextBuilder.observer.disconnect()
          contextBuilder.observer = null
        }
      })

    if (mutations) this.locator.handleMutations(mutations)
  }

  public createWidgetFactory<T>(Widget: any) {
    const me = this

    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    function createWidget(
      Widget: any,
      builder: WidgetBuilder,
      _insPointName: string,
      config: { [state: string]: T },
      order: number,
      contextNode: Element,
      clazz: string
    ): any {
      if (order === undefined || order === null) {
        //console.error('Empty order!');
        order = 0
      }

      const context = builder.contexts.get(contextNode)
      if (!context) return

      const insPointName = Widget.contextInsPoints[builder.contextName]

      const insPoint = builder.insPoints[insPointName]
      if (!insPoint) {
        console.error(`Invalid insertion point name: ${insPointName}`)
        return
      }

      // make it automatically when insertion point's element was changed
      const refreshSelector = (node: HTMLElement) => {
        const widgets = node.parentElement?.getElementsByClassName(clazz)
        const newInsertionPoint = insPoint.selector(
          contextNode,
          () => refreshSelector(node),
          clazz + '/' + context.parsed.id
        )
        Array.from(widgets).forEach((x) => {
          x.remove()
          newInsertionPoint.appendChild(x)
        })
      }

      const node = insPoint.selector
        ? typeof insPoint.selector === 'function'
          ? insPoint.selector(
              contextNode,
              () => refreshSelector(node),
              clazz + '/' + context.parsed.id
            )
          : (contextNode.querySelector(insPoint.selector) as HTMLElement)
        : insPoint.insPoints
        ? (contextNode.querySelector(
            insPoint.insPoints[Widget.contextInsPoints[insPointName]].selector
          ) as HTMLElement)
        : (contextNode as HTMLElement)

      if (!node) {
        // console.error(`There is no ${insPointName} in the ${_insPointName}. Check the selector.`);
        return
      }

      if (!node.parentNode) return

      // check if a widget already exists for the insPoint
      if (node.parentElement?.getElementsByClassName(clazz).length > 0) return

      // widget state restoring
      const state = (() => {
        const hasId = context.parsed.id !== undefined
        if (!hasId) {
          console.error(
            'Warning: Each parsed context in an adapter should have a unique "id" property. Restoring of widget states will be unavailable.'
          )
          return new State<T>(config, context.parsed, builder.theme)
        }

        const key = clazz + '/' + context.parsed.id

        if (!me.stateStorage.has(key)) {
          const state = new State<T>(config, context.parsed, builder.theme)
          me.stateStorage.set(key, state)
        }

        return me.stateStorage.get(key)
      })()

      let widget: any = null

      if (Widget.prototype instanceof HTMLElement) {
        // WebComponent-based widget
        const ExtendedWidget = class extends Widget {}

        // ToDo: dynamic adapter should not know about LitElement
        if (Widget.stylesByContext[builder.contextName]) {
          const cssAsString = Widget.stylesByContext[builder.contextName]
          ExtendedWidget.styles = unsafeCSS(cssAsString)
        }

        customElements.define(
          'dapplet-' + Widget.prototype.constructor.name.toLowerCase() + '-' + clazz,
          ExtendedWidget
        )

        const webcomponent = new ExtendedWidget()
        webcomponent.insPointName = builder.contextName
        webcomponent.ctx = context.parsed
        webcomponent.state = state.state

        // ID is used for lookup $ function and E2E-tests
        const testId = composeTestId(builder.contextName, context.parsed.id, state.id)
        if (testId) {
          webcomponent.setAttribute('data-testid', testId)
        }

        widget = {
          el: webcomponent,
          insPointName: builder.contextName, // for DemoDapplet
          state: state.state, // for WidgetBuilder.findWidget()
          unmount: () => {
            webcomponent && webcomponent?.remove()
          },
        }

        const updateWebComponent = (values: any) => {
          Object.entries(values).forEach(([k, v]) => (widget.el[k] = v))
        }

        updateWebComponent(state.getStateValues()) // initialize attributes from state
        state.changedHandler = updateWebComponent // subscribe on state changes
      } else {
        widget = new Widget() as IWidget<T>
        widget.state = state.state
        widget.insPointName = builder.contextName
        state.changedHandler = () => widget.mount() // when data in state was changed, then rerender a widget
        widget.mount() // ToDo: remove it?
      }

      widget.el.classList.add('dapplet-widget', clazz)
      widget.el.setAttribute('data-dapplet-order', order.toString())

      const insertTo: 'begin' | 'end' | 'inside' =
        insPoint.insert !== undefined
          ? insPoint.insert
          : insPoint.insPoints?.[Widget.contextInsPoints[insPointName]].insert === undefined
          ? 'end'
          : insPoint.insPoints[Widget.contextInsPoints[insPointName]].insert

      const insertedElements = node.parentNode.querySelectorAll(':scope > .dapplet-widget')

      if (insertedElements.length === 0) {
        switch (insertTo) {
          case 'end':
            node.parentNode.insertBefore(widget.el, node.nextSibling)
            break
          case 'begin':
            node.parentNode.insertBefore(widget.el, node)
            break
          case 'inside':
            node.appendChild(widget.el)
            break
          default:
            console.error(
              'Invalid "insert" value in the insertion point config. The valid values are "begin" or "end".'
            )
        }
      } else {
        let targetElementIndex = null

        // ToDo: find an element with the same order to throw the error
        // searching for an element index before which need to be inserted.
        for (let i = 0; i < insertedElements.length; i++) {
          const element = insertedElements[i]
          const elementOrder = parseInt(element.getAttribute('data-dapplet-order'))
          if (targetElementIndex === null && elementOrder > order) {
            targetElementIndex = i
          }
          // if (elementOrder === order) {
          //     console.error('A widget with such an order index already inserted.');
          // }
        }

        if (targetElementIndex === null) {
          const lastNode = insertedElements[insertedElements.length - 1]
          lastNode.parentNode.insertBefore(widget.el, lastNode.nextSibling) // insert after lastNode
        } else {
          const targetNode = insertedElements[targetElementIndex]
          targetNode.parentNode.insertBefore(widget.el, targetNode) // insert before targetNode
        }
      }

      return widget
    }

    return (config: WidgetConfig<T>) => {
      const uuid = uuidv4()
      return (builder: WidgetBuilder, insPointName: string, order: number, contextNode: Element) =>
        createWidget(Widget, builder, insPointName, config, order, contextNode, uuid)
    }
  }

  public deactivate() {
    this.contextBuilders.forEach((x) => x.observer?.disconnect())
    this.observer.disconnect()
  }

  private _getDappletConfigsForAdapter(adapterName: string) {
    return this.dappletConfigEnvelopes
      .filter((x) => x.adapterName === adapterName)
      .map((x) => x.config)
  }
}
