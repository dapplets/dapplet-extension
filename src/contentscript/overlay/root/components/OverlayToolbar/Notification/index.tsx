import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useRef } from 'react'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../../common/global-event-bus'
import { NotificationStatus } from '../../../../../../common/models/notification'
import { ReactComponent as Noties } from '../../../assets/icons/notificationIcons/defaultIcon.svg'
import { CloseIcon } from '../../CloseIcon'
import { DappletImage } from '../../DappletImage'
import styles from '../OverlayToolbar.module.scss'
// import { CloseIcon } from '../../CloseIcon'

export interface NotificationOverlayProps {
  payload: any
  onRemove: any

  handleOpenOverlayNotification?: any
}

export const NotificationOverlay = (props: NotificationOverlayProps): ReactElement => {
  const {
    payload,
    onRemove,

    handleOpenOverlayNotification,
  } = props
  const notificationRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (payload && !payload.payload) {
      let timerStyles
      let timerRemove

      timerStyles = setTimeout(() => {
        notificationRef.current?.classList.add('remove_notification')
        timerRemove = setTimeout(() => {
          onRemove(payload)
        }, 500)
      }, 9500)

      return () => {
        clearTimeout(timerStyles)
        clearTimeout(timerRemove)
      }
    }
  }, [])

  useEffect(() => {
    const handleUpdateNotifications = async () => {
      const { getNotifications } = await initBGFunctions(browser)
      const notifications = await getNotifications()
      if (
        notifications &&
        notifications.filter((x) => x.status === NotificationStatus.Default && x.id === payload.id)
      ) {
        notificationRef.current?.classList.add('remove_notification')
        setTimeout(() => {
          onRemove(payload)
        }, 500)
      }
    }
    EventBus.on('notifications_updated', handleUpdateNotifications)

    return () => {
      EventBus.off('notifications_updated', handleUpdateNotifications)
    }
  }, [])

  const handleActionButtonClick = () => {
    notificationRef.current?.classList.add('remove_notification')
    handleOpenOverlayNotification()
    setTimeout(() => {
      onRemove(payload)
    }, 500)
  }

  function trimText(text, length) {
    if (text.length > length) {
      return text.slice(0, length) + '...'
    } else {
      return text
    }
  }

  if (payload) {
    return (
      <div
        data-testid="notification-label"
        ref={notificationRef}
        className={cn(styles.widgetButtonNotificationTeaser)}
      >
        <div className={styles.titleNotificationWrapperTeaser}>
          <div className={styles.notificationBlockTop}>
            <div className={styles.iconNotificationBlock} onClick={handleActionButtonClick}>
              {payload.icon ? (
                <DappletImage storageRef={payload.icon} className={styles.iconNotification} />
              ) : (
                <Noties />
              )}
            </div>
            <div className={styles.blockNotificationInfo}>
              <div className={styles.titleNotificationWrapperTeaser}>
                <div onClick={handleActionButtonClick} className={styles.titleNotificationTeaser}>
                  {payload.title}
                </div>
                <CloseIcon
                  className={styles.closeNotification}
                  appearance="small"
                  color="red"
                  isNotification
                  onClick={() => {
                    notificationRef.current?.classList.add('remove_notification')
                    setTimeout(() => {
                      onRemove(payload)
                    }, 500)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleOpenOverlayNotification()
            onRemove(payload)
          }}
          className={styles.messageNotification}
          style={{ cursor: 'pointer' }}
        >
          {payload.teaser
            ? trimText(payload.teaser, 50)
            : payload.message
            ? trimText(payload.message, 36)
            : null}
          <span>{'  '}</span>
          {payload.teaser ? null : <span className={styles.showMore}>show more</span>}
        </div>
      </div>
    )
  } else null
}
