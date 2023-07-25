import browser from 'webextension-polyfill'
import { TAlertAndConfirmPayload } from '../../common/types'

export const showAlertOrConfirm = async (
  payload: TAlertAndConfirmPayload,
  tabId: number
): Promise<boolean> =>
  browser.tabs.sendMessage(tabId, {
    type: 'ALERT_OR_CONFIRM',
    payload,
  })
