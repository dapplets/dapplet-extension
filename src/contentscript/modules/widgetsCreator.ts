import { State } from './state'
import { IWidget, WidgetConfig } from './types'

export class WidgetsCreator {
  private stateStorage = new Map<string, State<any>>()
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
      builder: any,
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

      const context = builder && builder.contexts ? builder.contexts.get(contextNode) : null
      const state = (() => {
        const hasId = context && context.parsed.id !== undefined
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

      widget = new Widget() as IWidget<T>
      widget.state = state.state
      widget.insPointName = state.INITIAL_STATE

      state.changedHandler = () => widget.mount()
      widget.mount() // ToDo: remove it?

      return widget
    }

    return (config: WidgetConfig<T>) => {
      const uuid = uuidv4()
      return (builder: any, insPointName: string, order: number, contextNode: Element) =>
        createWidget(Widget, builder, insPointName, config, order, contextNode, uuid)
    }
  }
}
