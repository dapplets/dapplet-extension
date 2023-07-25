import cn from 'classnames'
import React, { useCallback, useEffect, useState } from 'react'
import * as EventBus from '../../../../../common/global-event-bus'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { TAlertAndConfirmPayload } from '../../../../../common/types'
import { LinkifyText } from '../LinkifyText'
import stylesNotifications from '../OverlayToolbar/OverlayToolbar.module.scss'
import stylesAlerts from './AlertConfirmPopup.module.scss'

const AlertConfirmPopup = (props: { payload: TAlertAndConfirmPayload }) => {
  const { payload } = props
  const [isOpen, setIsOpen] = useState<boolean>(true)

  const proceed = useCallback(() => {
    setIsOpen(false)
    EventBus.emit('alert_or_confirm_result', { id: payload.id, result: true })
  }, [payload.id])

  const cancel = () => {
    setIsOpen(false)
    EventBus.emit('alert_or_confirm_result', { id: payload.id, result: false })
  }

  useEffect(() => {
    const handleKeydown = (e) => {
      if (proceed && isOpen && e.key === 'Enter') {
        proceed()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [proceed, isOpen])

  const isNarrowModal = payload.title.length < 20 && payload.message.length < 40

  return (
    <div
      data-testid="actions-label"
      style={{ display: isOpen ? 'flex' : 'none' }}
      className={cn(stylesNotifications.widgetButtonNotification, {
        [stylesAlerts.wrapper]: isNarrowModal,
      })}
    >
      <div className={stylesNotifications.notificationBlockTop}>
        <div className={stylesNotifications.iconNotificationBlock}>
          <div className={cn(stylesNotifications.iconNotification, stylesAlerts.iconAlert)}>
            <img src={payload.icon ? payload.icon.uris[0] : NO_LOGO} />
          </div>
        </div>
        <div className={isNarrowModal ? stylesAlerts.textPartSmall : stylesAlerts.textPartBig}>
          <div className={stylesNotifications.titleNotification}>
            <LinkifyText>{payload.title}</LinkifyText>
          </div>
          <div className={stylesNotifications.messageNotification}>
            <LinkifyText>{payload.message}</LinkifyText>
          </div>
          <div className={stylesNotifications.buttonNotificationBlock}>
            <button className={stylesNotifications.buttonNotification} onClick={proceed}>
              Ok
            </button>
            {payload.type === 'confirm' && (
              <button className={stylesNotifications.buttonNotification} onClick={cancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertConfirmPopup
