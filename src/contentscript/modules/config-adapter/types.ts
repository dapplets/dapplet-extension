export type ContextBuilder = {
  [key: string]: ContextBuilder | string
}

export type ParserConfig = {
  themes?: {
    DARK?: string
    LIGHT?: string
  }
  contexts: {
    [contextName: string]: {
      containerSelector: string
      contextSelector?: string
      insPoints?: {
        [insPointName: string]: {
          selector: string
          insert?: string
        }
      }
      events?: {
        [eventName: string]: {
          element: string
          listen: string
          data?: {
            [key: string]: string
          }
        }
      }
      contextBuilder: ContextBuilder
      childrenContexts?: string[]
    }
  }
}
