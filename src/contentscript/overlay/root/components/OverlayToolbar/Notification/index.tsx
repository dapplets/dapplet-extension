import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useRef } from 'react'
import browser from 'webextension-polyfill'
import { ReactComponent as Noties } from '../../../assets/icons/notificationIcons/defaultIcon.svg'
import { addZero } from '../../../helpers/addZero'
import { CloseIcon } from '../../CloseIcon'
import { DappletImage } from '../../DappletImage'
import { LinkifyText } from '../../LinkifyText'
import styles from '../OverlayToolbar.module.scss'
// import { CloseIcon } from '../../CloseIcon'

export interface NotificationOverlayProps {
  payload: any
  onRemove: any
  setPinnedNotification: any
  index: any
  isPinnedNotification: any
}

export const NotificationOverlay = (props: NotificationOverlayProps): ReactElement => {
  const { payload, onRemove, setPinnedNotification, index, isPinnedNotification } = props
  const notificationRef = useRef<HTMLDivElement>()
  const handleActionButtonClick = async (actionId: string) => {
    const { resolveNotificationAction, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()

    setTimeout(() => {
      onRemove(payload)
    }, 500)

    await resolveNotificationAction(payload.id, actionId, thisTab.id)
  }

  const dateNum = (date) => {
    const newDateNum = new Date(date)
    return newDateNum
  }

  if (payload && !payload.payload) {
    // setTimeout(() => {
    //   notificationRef.current?.classList.add('remove_notification')
    // }, 9500)
    setTimeout(() => {
      setPinnedNotification(false)

      onRemove(payload)
    }, 10000)
  }

  if (payload) {
    return (
      <div
        key={index}
        data-testid="notification-label"
        ref={notificationRef}
        className={cn(styles.widgetButtonNotification, {
          [styles.widgetButtonAnimatePinnedNotification]: isPinnedNotification,
        })}
      >
        <div className={styles.notificationBlockTop}>
          <div className={styles.iconNotificationBlock}>
            {payload.icon ? (
              <DappletImage storageRef={payload.icon} className={styles.iconNotification} />
            ) : (
              <Noties />
            )}
          </div>
          <div className={styles.blockNotificationInfo}>
            <div className={styles.titleNotificationWrapper}>
              <div className={styles.titleNotification}>
                <LinkifyText>{payload.title}</LinkifyText>
              </div>
              <span className={styles.date}>
                <span>
                  {addZero(dateNum(payload.createdAt).getFullYear()) +
                    '.' +
                    addZero(dateNum(payload.createdAt).getMonth() + 1) +
                    '.' +
                    addZero(dateNum(payload.createdAt).getDate())}
                </span>{' '}
                <span>
                  {addZero(dateNum(payload.createdAt).getHours()) +
                    ':' +
                    addZero(dateNum(payload.createdAt).getMinutes())}
                </span>
              </span>
              <CloseIcon
                className={styles.closeMotification}
                appearance="small"
                color="red"
                isNotification
                onClick={(e) => {
                  // e.currentTarget.parentElement.parentElement.parentElement.parentElement.classList.add(
                  //   'remove_notification'
                  // )
                  setTimeout(() => {
                    onRemove(payload)

                    setPinnedNotification(false)
                  }, 500)
                }}
              />
            </div>
            {payload.message ? (
              <div className={styles.messageNotification}>
                <LinkifyText>{payload.message}</LinkifyText>
              </div>
            ) : null}
            {payload.actions?.length > 0 ? (
              <div className={styles.buttonNotificationBlock}>
                {payload.actions.map(({ action, title }) => (
                  <button
                    className={styles.buttonNotification}
                    key={action}
                    onClick={() => handleActionButtonClick(action)}
                  >
                    {title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  } else null
}