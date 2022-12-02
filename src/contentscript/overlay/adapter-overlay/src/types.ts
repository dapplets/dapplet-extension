export type Exports = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [propName: string]: any
  }
  
  
  export interface ButtonProps {
    ctx: any
    title: string
    icon?: string
    disabled?: boolean
    hidden?: boolean
    pinned?: string
    action: (ctx: any, me: ButtonProps) => void
  }

  export type WidgetConfig<T> = {
    [key: string]: T
  } & {
    id?: string
    initial?: string
  }
  
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
  }
  export interface IWidget<T> {
    mount(): void;
    unmount(): void;
    el: HTMLElement;
    state: T;
    insPointName: string;
  }
  export type Context = {
    parsed: any
    eventHandlers: { [event: string]: Function[] }
  }
  export interface IWidgetBuilderConfig {
    containerSelector: string
    contextSelector?: string
    insPoints: { [key: string]: any }
    contextBuilder: (tweetNode: any, parent: any) => any | undefined
  }

  export interface ILabelWidgetState {
    icon?: any
    hidden?: boolean
    title?: string
    ctx?: any
    insPointName?: string
    theme?: string
  }