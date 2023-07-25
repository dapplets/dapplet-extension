import cn from 'classnames'
import React, { useEffect } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { LinkifyText } from '../LinkifyText'
import stylesNotifications from '../OverlayToolbar/OverlayToolbar.module.scss'
import stylesAlerts from './AlertConfirmPopup.module.scss'
import { ModalProps } from './contexts/ModalContext/ModalContext'

const AlertConfirmPopup = (props: { payload: ModalProps }) => {
  const { payload } = props
  const { title, message, icon, type, onResolve } = payload

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        onResolve(true)
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onResolve])

  const isNarrowModal = title.length < 20 && message.length < 40

  return (
    <div
      data-testid="actions-label"
      className={cn(stylesNotifications.widgetButtonNotification, {
        [stylesAlerts.wrapper]: isNarrowModal,
      })}
    >
      <div className={stylesNotifications.notificationBlockTop}>
        <div className={stylesNotifications.iconNotificationBlock}>
          <div className={cn(stylesNotifications.iconNotification, stylesAlerts.iconAlert)}>
            <img src={icon ? icon.uris[0] : NO_LOGO} />
          </div>
        </div>
        <div className={isNarrowModal ? stylesAlerts.textPartSmall : stylesAlerts.textPartBig}>
          <div className={stylesNotifications.titleNotification}>
            <LinkifyText>{title}</LinkifyText>
          </div>
          <div className={stylesNotifications.messageNotification}>
            <LinkifyText>{message}</LinkifyText>
          </div>
          <div className={stylesNotifications.buttonNotificationBlock}>
            <button
              className={stylesNotifications.buttonNotification}
              onClick={() => onResolve(true)}
            >
              Ok
            </button>
            {type === 'confirm' && (
              <button
                className={stylesNotifications.buttonNotification}
                onClick={() => onResolve(false)}
              >
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
