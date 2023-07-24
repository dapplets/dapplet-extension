import React, { useEffect, useRef, useState } from 'react'
import * as EventBus from '../../../../../common/global-event-bus'
import { TAlertAndConfirmPayload } from '../../../../../common/types'
import AlertConfirmPopup from '../AlertConfirmPopup'

const AlertsAndConfirms = () => {
  const alertsAndConfirms = useRef<TAlertAndConfirmPayload[]>([])
  const [, update] = useState<number>(0)

  useEffect(() => {
    const addAlertOrConfirm = async (payload: TAlertAndConfirmPayload) => {
      alertsAndConfirms.current = [...alertsAndConfirms.current, payload]
      update(Math.random())
    }

    const deleteAlertOrConfirm = async (payload: TAlertAndConfirmPayload) => {
      alertsAndConfirms.current = alertsAndConfirms.current.filter(
        (alertOrConfirm) => alertOrConfirm.id !== payload.id
      )
      update(Math.random())
    }

    EventBus.on('show_alert_or_confirm', addAlertOrConfirm)
    EventBus.on('alert_or_confirm_result', deleteAlertOrConfirm)

    return () => {
      EventBus.off('show_alert_or_confirm', addAlertOrConfirm)
      EventBus.on('alert_or_confirm_result', deleteAlertOrConfirm)
    }
  }, [])

  return (
    <>
      {alertsAndConfirms.current.length > 0 &&
        alertsAndConfirms.current.map((alertOrConfirm) => (
          <AlertConfirmPopup key={alertOrConfirm.id} payload={alertOrConfirm} />
        ))}
    </>
  )
}

export default AlertsAndConfirms
