import { IFeature } from '../../../types'
import { ButtonWidget, LabelWidget } from './classesWidget'
import { State } from './state'
import {
  ButtonProps,
  Exports,
  IButtonWidgetState,
  ILabelWidgetState,
  IWidget,
  WidgetConfig,
} from './types'
import { WidgetBuilder } from './widgetBildet'

export default class OverlayAdapter {
  public state: ButtonProps
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
      return (builder: WidgetBuilder, insPointName: string, order: number, contextNode: Element) =>
        createWidget(Widget, builder, insPointName, config, order, contextNode, uuid)
    }
  }
}
