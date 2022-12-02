import { IFeature } from '../../../types'
import { ButtonWidget, LabelWidget } from './classesWidget'
import { State } from './state'
import { ButtonProps,Context,Exports, IButtonWidgetState, ILabelWidgetState, IWidget, IWidgetBuilderConfig, WidgetConfig } from './types'
import { WidgetBuilder } from './widgetBildet'

export default class OverlayAdapter {
  public state:ButtonProps
  private stateStorage = new Map<string, State<any>>()
  public exports = (): Exports => ({
    button: this.createWidgetFactory<IButtonWidgetState>(ButtonWidget),
    label: this.createWidgetFactory<ILabelWidgetState>(LabelWidget),
  })
  public config = {
    MENU_ACTION: {},
  }

  constructor(readonly adapter: any) {}
  public attachConfig(feature: IFeature): void {
    this.adapter.attachConfig(feature)
  }
  public detachConfig(config, featureId) {
    this.adapter.detachConfig(config, featureId)
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

      const context =builder && builder.contexts?  builder.contexts.get(contextNode):null
      // if (!context) return

      const insPointName = Widget.contextInsPoints[builder&& builder.contextName? builder.contextName: 'DEFAULT']

      const insPoint = builder&& builder.insPoints? builder.insPoints[insPointName]:'DEFAULT'
      // if (!insPoint) {
      //   console.error(`Invalid insertion point name: ${insPointName}`)
      //   return
      // }

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

      // if (!node) {
      //   // console.error(`There is no ${insPointName} in the ${_insPointName}. Check the selector.`);
      //   return
      // }

      // if (!node.parentNode) return

      // check if a widget already exists for the insPoint
      // if (node.parentElement?.getElementsByClassName(clazz).length > 0) return

      // widget state restoring
      const state = (() => {
        const hasId = context&& context.parsed.id !== undefined
        if (!hasId) {
          // console.error(
          //   'Warning: Each parsed context in an adapter should have a unique "id" property. Restoring of widget states will be unavailable.'
          // )
          return new State<T>(config, null, null)
        }

        const key = clazz + '/' + 'context.parsed.id'

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
        customElements.define(
          'dapplet-' + Widget.prototype.constructor.name.toLowerCase() + '-' + clazz,
          ExtendedWidget
        )

        const webcomponent = new ExtendedWidget()
        webcomponent.insPointName = 'DEFAULT'
        webcomponent.ctx = context.parsed
        webcomponent.state = state.state

        widget = {
          el: webcomponent,
          insPointName: builder.contextName, // for DemoDapplet
          state: state.state, // for WidgetBuilder.findWidget()
          unmount: () => {
            webcomponent && webcomponent.remove()
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
        widget.insPointName = 'DEFAULT'
        state.changedHandler = () => widget.mount() // when data in state was changed, then rerender a widget
        widget.mount() // ToDo: remove it?

      }

      // widget.el.classList.add('dapplet-widget', clazz)
      // widget.el.setAttribute('data-dapplet-order', order.toString())

      const insertTo: 'begin' | 'end' | 'inside' =
        insPoint.insert !== undefined
          ? insPoint.insert
          : insPoint.insPoints?.[Widget.contextInsPoints[insPointName]].insert === undefined
          ? 'end'
          : insPoint.insPoints[Widget.contextInsPoints[insPointName]].insert

      const insertedElements = ''

      if (insertedElements.length === 0) {
        switch (insertTo) {
          case 'end':
            // node.parentNode.insertBefore(widget.el, node.nextSibling)
            break
          case 'begin':
            // node.parentNode.insertBefore(widget.el, node)
            break
          case 'inside':
            // node.appendChild(widget.el)
            break
          // default:
          //   console.error(
          //     'Invalid "insert" value in the insertion point config. The valid values are "begin" or "end".'
          //   )
        }
      } else {
        let targetElementIndex = null

        // ToDo: find an element with the same order to throw the error
        // searching for an element index before which need to be inserted.
        for (let i = 0; i < insertedElements.length; i++) {
          // const element = insertedElements[i]
          const elementOrder =null
          //  parseInt(element.getAttribute('data-dapplet-order'))
          if (targetElementIndex === null && elementOrder > order) {
            targetElementIndex = i
          }
          // if (elementOrder === order) {
          //     console.error('A widget with such an order index already inserted.');
          // }
        }

        if (targetElementIndex === null) {
          const lastNode = insertedElements[insertedElements.length - 1]
          // lastNode.parentNode.insertBefore(widget.el, lastNode.nextSibling) // insert after lastNode
        } else {
          const targetNode = insertedElements[targetElementIndex]
          // targetNode.parentNode.insertBefore(widget.el, targetNode) // insert before targetNode
        }
      }
      return widget
    }

    return (config: WidgetConfig<T>) => {
      const uuid = uuidv4()
      return  (builder: WidgetBuilder, insPointName: string, order: number, contextNode: Element) =>
        createWidget(Widget, builder, insPointName, config, order, contextNode, uuid)
    }
  }
}








