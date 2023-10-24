import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../../common/global-event-bus'
import { ReactComponent as Noties } from '../../../assets/icons/notificationIcons/defaultIcon.svg'
import { CloseIcon } from '../../CloseIcon'
import { DappletImage } from '../../DappletImage'
import styles from '../OverlayToolbar.module.scss'
export interface NotificationOverlayProps {
  payload: any
  onRemove: any
  handleOpenOverlayNotification?: any
}

export const NotificationOverlay = (props: NotificationOverlayProps): ReactElement => {
  const { payload, onRemove, handleOpenOverlayNotification } = props

  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (payload && !payload.payload) {
      let timerRemove

      const timerStyles = setTimeout(() => {
        // ToDo: move timeout to separate function
        setIsRemoving(true)
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
    let timerRemove

    const handleViewNotifications = (viewedIds: string[]) => {
      if (viewedIds.includes(payload.id)) {
        setIsRemoving(true)
        timerRemove = setTimeout(() => {
          onRemove(payload)
        }, 500)
      }
    }
    EventBus.on('notifications_viewed', handleViewNotifications)

    return () => {
      EventBus.off('notifications_viewed', handleViewNotifications)
      clearTimeout(timerRemove)
    }
  }, [])

  const handleActionButtonClick = () => {
    setIsRemoving(true)
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

  if (!payload) {
    return null
  }
  const setReadNotifications = async (id) => {
    const { markNotificationAsViewed } = await initBGFunctions(browser)

    await markNotificationAsViewed(id)
  }
  return (
    <div
      data-testid="notification-label"
      // onClick={(e) => {
      //   e.preventDefault()
      //   e.stopPropagation()
      //   handleOpenOverlayNotification(payload.id)
      //   onRemove(payload)
      // }}
      className={cn(styles.widgetButtonNotificationTeaser, { remove_notification: isRemoving })}
    >
      <div className={styles.titleNotificationWrapperTeaser}>
        <div className={styles.notificationBlockTop}>
          <div
            className={styles.iconNotificationBlock}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenOverlayNotification(payload.id)
              onRemove(payload)
            }}
          >
            {payload.icon ? (
              <DappletImage storageRef={payload.icon} className={styles.iconNotification} />
            ) : (
              <Noties />
            )}
          </div>
          <div className={styles.blockNotificationInfo}>
            <div className={styles.titleNotificationWrapperTeaser}>
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleOpenOverlayNotification(payload.id)
                  onRemove(payload)
                }}
                className={styles.titleNotificationTeaser}
              >
                {payload.title}
              </div>
              <CloseIcon
                className={styles.closeNotification}
                appearance="small"
                color="red"
                isNotification
                onClick={() => {
                  setReadNotifications(payload.id)
                  setIsRemoving(true)

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
          handleOpenOverlayNotification(payload.id)
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
}
