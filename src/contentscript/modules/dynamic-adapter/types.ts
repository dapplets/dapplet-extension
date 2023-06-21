export interface IWidgetBuilderConfig {
  containerSelector: string
  contextSelector?: string
  insPoints: { [key: string]: any }
  contextBuilder: (tweetNode: any, parent: any) => any | undefined
}

export type Context = {
  parsed: any
  eventHandlers: { [event: string]: Function[] }
}

export interface IWidget<T> {
  mount(): void
  unmount(): void
  el: HTMLElement
  state: T
  insPointName: string
}
