import browser from 'webextension-polyfill'
import * as EventBus from '../../common/global-event-bus'
import { TAlertAndConfirmPayload } from '../../common/types'

export const showAlertOrConfirm = async (
  payload: TAlertAndConfirmPayload,
  tabId: number
): Promise<boolean> => {
  browser.tabs.sendMessage(tabId, {
    type: 'ALERT_OR_CONFIRM',
  })
  EventBus.emit('show_alert_or_confirm', payload)
  const promise = new Promise((resolve: (value: void) => void, reject) => {
    EventBus.on('alert_or_confirm_result', (answer) => {
      if (answer.id === payload.id) return answer.result ? resolve() : reject()
    })
  })
  return promise.then(
    () => true,
    () => false
  )
}
