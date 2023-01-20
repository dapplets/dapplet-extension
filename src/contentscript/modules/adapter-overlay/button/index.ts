import { IWidget } from '../../types'

export interface IButtonWidgetState {
  icon?: any
  disabled?: boolean
  hidden?: boolean
  title?: string
  action?: (ctx: any, me: IButtonWidgetState) => void
  init?: (ctx: any, me: IButtonWidgetState) => void
  ctx?: any
  insPointName?: string
  theme?: string
  pinned?: boolean
  pinnedId?: string
}

export class ButtonWidget implements IWidget<IButtonWidgetState> {
  public el: HTMLElement
  public state: IButtonWidgetState
  public insPointName: string

  public static contextInsPoints = {
    MENU_ACTION: 'DEFAULT',
  }

  public mount() {}

  public unmount() {
    this.el && this.el.remove()
  }
}
