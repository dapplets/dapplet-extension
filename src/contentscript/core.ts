import browser from 'webextension-polyfill'
import { generateGuid } from '../common/generateGuid'
import { ContentDetector, SystemOverlayTabs } from '../common/types'
import { IOverlayManager } from './overlay/interfaces'
import { Swiper } from './swiper'

export default class Core {
  constructor(isIframe: boolean, public overlayManager: IOverlayManager) {
    if (!isIframe) {
      browser.runtime.onMessage.addListener((message, sender) => {
        if (typeof message === 'string') {
          if (message === 'TOGGLE_OVERLAY') {
            this.toggleOverlay()
          } else if (message === 'OPEN_OVERLAY') {
            // used by pure jslib
            this.openOverlay()
          } else if (message === 'CLOSE_OVERLAY') {
            // used by pure jslib
            this.closeOverlay()
          }
        } else if (typeof message === 'object' && message.type !== undefined) {
          // ToDo: refactor this messaging. May be use global event bus?
          if (message.type === 'OPEN_PAIRING_OVERLAY') {
            if (message.payload.topic === 'walletconnect') {
              // const [, overlayId] = message.payload.args
              // ToDo: utilize target overlayId
              this.overlayManager.systemPopupEventBus.publish(
                message.payload.topic,
                message.payload.args
              )
              return Promise.resolve([null, 'ready'])
            }
          } else if (message.type === 'OPEN_POPUP_OVERLAY') {
            return Promise.resolve(this.overlayManager.togglePanel())
          } else if (message.type === 'OPEN_SYSTEM_OVERLAY') {
            return this.waitSystemOverlay(message.payload)
              .then((x) => [null, x])
              .catch((err) => [err])
          }
        }
      })

      // API for context web pages
      window.addEventListener('message', ({ data }) => {
        if (typeof data === 'object' && data.type !== undefined) {
          if (data.type === 'OPEN_POPUP_OVERLAY') {
            return Promise.resolve(this.overlayManager.togglePanel())
          } else if (data.type === 'CLOSE_OVERLAY') {
            this.closeOverlay()
          }
        }
      })

      const swiper = new Swiper(document.body)
      swiper.on('left', () => this.openOverlay())
      swiper.on('right', () => this.overlayManager.close())
    }
  }

  public async waitSystemOverlay(data: {
    activeTab: SystemOverlayTabs
    payload: any
    popup?: boolean
  }): Promise<any> {
    const frameRequestId = generateGuid()

    return new Promise<void>((resolve, reject) => {
      data.popup = true

      // ToDo: utilize target overlayId
      // const isTargetLoginSession =
      //   data.activeTab === SystemOverlayTabs.LOGIN_SESSION && data.payload?.loginRequest?.target
      // const parentOverlay = isTargetLoginSession
      //   ? this.overlayManager.getOverlays().find((x) => x.id === data.payload.loginRequest.target)
      //   : null

      // const popupOverlay = parentOverlay
      //   ? this.overlayManager.getOverlays().find((x) => x.parent?.id === parentOverlay.id)
      //   : null

      // ToDo: unify open/show
      this.overlayManager.openPopup()
      this.overlayManager.open()

      const eventBus = this.overlayManager.systemPopupEventBus!

      const handleCancel = () => {
        // ToDo: compare frameResponseId and frameRequestId
        eventBus.publish('close_frame', [frameRequestId])
        eventBus.unsubscribe('cancel', handleCancel)
        reject('Unexpected error.')
      }

      const handleReady = (frameResponseId, message) => {
        // ToDo: compare frameResponseId and frameRequestId
        eventBus.publish('close_frame', [frameRequestId])
        eventBus.unsubscribe('ready', handleReady)
        resolve(message)
      }

      eventBus.publish('data', [frameRequestId, data])
      eventBus.subscribe('cancel', handleCancel)
      eventBus.subscribe('ready', handleReady)
    })
  }

  public toggleOverlay() {
    this.overlayManager.toggle()
  }

  public closeOverlay() {
    this.overlayManager && this.overlayManager.unregisterAll()
  }

  public openOverlay() {
    this.toggleOverlay()
  }

  public getContentDetectors(): ContentDetector[] {
    // Note: take it from a registry in the future
    return [
      {
        contextId: 'video',
        selector: 'video',
      },
    ]
  }

  // ToDo: dynamic adapter calls these methods that are not implemented yet
  contextStarted(contextIds: any[], parentContext?: string): void {}
  contextFinished(contextIds: any[], parentContext?: string): void {}
}
