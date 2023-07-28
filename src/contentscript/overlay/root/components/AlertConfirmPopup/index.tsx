import cn from 'classnames'
import React, { useEffect, useRef } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { ModalProps } from '../../contexts/ModalContext/ModalContext'
import { LinkifyText } from '../LinkifyText'
import stylesNotifications from '../OverlayToolbar/OverlayToolbar.module.scss'
import { StorageRefImg } from '../StorageRefImg'
import stylesAlerts from './AlertConfirmPopup.module.scss'

const AlertConfirmPopup = (props: { payload: ModalProps }) => {
  const { payload } = props
  const { title, message, icon, type, onResolve } = payload
  const buttonRef = useRef(null)

  useEffect(() => buttonRef.current.focus(), [])

  useEffect(() => {
    const handleKeydown = (e) => {
      if (buttonRef.current === document.activeElement && e.key === 'Enter') {
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
            <StorageRefImg storageRef={icon} noImgSrc={NO_LOGO} />
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
              ref={buttonRef}
              className={stylesNotifications.buttonNotification}
              onClick={(e) => {
                e.currentTarget.parentElement.parentElement.parentElement.parentElement.classList.add(
                  'remove_notification'
                )
                setTimeout(() => {
                  onResolve(true)
                }, 500)
              }}
            >
              Ok
            </button>
            {type === 'confirm' && (
              <button
                className={stylesNotifications.buttonNotification}
                onClick={(e) => {
                  e.currentTarget.parentElement.parentElement.parentElement.parentElement.classList.add(
                    'remove_notification'
                  )
                  setTimeout(() => {
                    onResolve(false)
                  }, 500)
                }}
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
