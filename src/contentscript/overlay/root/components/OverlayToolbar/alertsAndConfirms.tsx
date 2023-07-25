import React, { useEffect } from 'react'
import browser from 'webextension-polyfill'
import { TAlertAndConfirmPayload } from '../../../../../common/types'
import AlertConfirmPopup from '../AlertConfirmPopup'
import { useModal } from '../AlertConfirmPopup/contexts/ModalContext'

const AlertsAndConfirms = () => {
  const { modals, confirm } = useModal()

  useEffect(() => {
    const addAlertOrConfirm = async (message: {
      type: string
      payload: TAlertAndConfirmPayload
    }) => {
      if (message.type === 'ALERT_OR_CONFIRM') return confirm(message.payload)
    }
    browser.runtime.onMessage.addListener(addAlertOrConfirm)
    return () => browser.runtime.onMessage.removeListener(addAlertOrConfirm)
  }, [])

  return (
    <>
      {modals.length > 0 &&
        modals.map((alertOrConfirm) => (
          <AlertConfirmPopup key={alertOrConfirm.id} payload={alertOrConfirm} />
        ))}
    </>
  )
}

export default AlertsAndConfirms
