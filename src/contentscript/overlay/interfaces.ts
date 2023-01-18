import { Bus } from '../../common/bus'
import { IPubSub } from '../types'

export type OverlaySourceModule = {
  name: string
  registryUrl: string
}

export type OverlayConfig = {
  url: string
  title: string
  source?: string
  hidden?: boolean
  parent?: IOverlay
  module?: OverlaySourceModule
  isSystemPopup?: boolean
}

export interface IOverlay extends IPubSub {
  id: string
  url: string
  title: string
  registered: boolean
  parent: IOverlay
  source: string
  send(topic: string, args: any[]): void
  onclose: Function
  onregisteredchange: (value: boolean) => void
  onMessage(handler: (topic: string, message: any) => void): {
    off: () => void
  }
  open(callback?: Function): void
  close(): void
  frame: HTMLIFrameElement
}

export interface IOverlayManager {
  systemPopupEventBus?: Bus
  openPopup(path?: string): void
  unregisterAll(source?: string): void
  open(): void
  close(): void
  getOverlays(): IOverlay[]
  toggle(): void
  createOverlay(config: OverlayConfig): IOverlay
  destroy(): void
}
