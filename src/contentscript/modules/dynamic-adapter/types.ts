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

export type AdapterConfig = {
  [contextName: string]: {
    containerSelector: string
    contextSelector: string
    insPoints: {
      [insPointName: string]: {
        selector: string
        insert?: 'begin' | 'end' | 'inside'
      }
    }
    events: {
      [eventName: string]: (node: any, ctx: any, emit: (ctx: any) => void) => void
    }
    contextBuilder: (el: HTMLElement) => any
    theme: () => string
    childrenContexts?: string[]
  }
}
