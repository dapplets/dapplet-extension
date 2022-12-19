export type Exports = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propName: string]: any
}

export type WidgetConfig<T> = {
  [key: string]: T
} & {
  id?: string
  initial?: string
}

export interface IWidget<T> {
  mount(): void
  unmount(): void
  el: HTMLElement
  state: T
  insPointName: string
}
export type Context = {
  parsed: any
  eventHandlers: { [event: string]: Function[] }
}
