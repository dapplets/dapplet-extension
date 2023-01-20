import { IWidget } from '../../types'

export interface ILabelWidgetState {
  icon?: any
  hidden?: boolean
  title?: string
  ctx?: any
  insPointName?: string
  theme?: string
  pinned?: boolean
  pinnedId?: string
}

export class LabelWidget implements IWidget<ILabelWidgetState> {
  public el: HTMLElement
  public state: ILabelWidgetState
  insPointName: string

  public static contextInsPoints = {
    MENU_ACTION: 'DEFAULT',
  }

  public mount() {}
  public unmount() {
    this.el && this.el.remove()
  }
}
