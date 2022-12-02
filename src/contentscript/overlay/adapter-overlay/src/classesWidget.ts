import { IButtonWidgetState, ILabelWidgetState, IWidget } from "./types"

export class LabelWidget implements IWidget<ILabelWidgetState> {
    public el: HTMLElement
    public state: ILabelWidgetState
    insPointName: string
  
    // ToDo
    public static widgetParamsDescription = {
      label: {
        description: 'text label',
        optional: true,
        TYPE: 'string',
      },
      exec: {
        description: 'action on click',
        optional: true,
        TYPE: '(ctx: any, me: IButtonStarterState) => void',
      },
    }
  
    public static contextInsPoints = {
      MENU_ACTION: 'DEFAULT',
    }
  
    public mount() {
      
      const { icon, hidden, title,ctx } = this.state
  
      this.state
    }
    public unmount() {
      this.el && this.el.remove()
    }
  }

  export class ButtonWidget implements IWidget<IButtonWidgetState> {
    public el: HTMLElement
    public state: IButtonWidgetState
    insPointName: string
  
    public static contextInsPoints = {
      MENU_ACTION: 'DEFAULT',
    }
  
    public mount() {
      const { icon, hidden, title,ctx } = this.state
      this.state
    }
  
    public unmount() {
      this.el && this.el.remove()
    }
  }