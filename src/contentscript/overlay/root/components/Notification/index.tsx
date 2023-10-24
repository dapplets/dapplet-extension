import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { NotificationStatus } from '../../../../../common/models/notification'
import { StorageRef } from '../../../../../common/types'
import { addZero } from '../../helpers/addZero'
import { DappletImage } from '../DappletImage'
import { LinkifyText } from '../LinkifyText'
import styles from './Notification.module.scss'

export interface NotificationProps {
  label: string
  icon?: StorageRef
  title: string
  date: any
  onClear?: (x) => void
  href?: string
  _id: any
  description: any
  status?: NotificationStatus
  actions?: NotificationAction[]
  stateNotify?: any
}

export const Notification: React.FC<NotificationProps> = (props) => {
  const { icon, title, date, onClear, _id, description, href, status, actions, stateNotify } = props

  const [isDelete] = useState(false)
  const [newDescription] = useState(description)
  const refComponent = useRef<HTMLInputElement>()
  const newDateNum = new Date(date)

  async function handleActionButtonClick(
    actionId: string,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    // prevent concurrent execution of resolveNotificationAction and markNotificationAsViewed functions
    event.stopPropagation()
    event.preventDefault()

    const { resolveNotificationAction, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    await resolveNotificationAction(_id, actionId, thisTab.id)
  }

  useEffect(() => {
    if (stateNotify && stateNotify.targetID === _id) {
      let timerRemove

      const timerStyles = setTimeout(() => {
        timerRemove = setTimeout(() => {
          onClear(stateNotify.targetID)
        }, 3000)
      }, 2500)

      return () => {
        clearTimeout(timerStyles)
      }
    }
  }, [stateNotify])

  const isOldNotification =
    status === NotificationStatus.Default ||
    status === NotificationStatus.Resolved ||
    (stateNotify && stateNotify.isLaterRead && stateNotify.targetID === _id)

  return (
    <div
      onClick={() => onClear && onClear(_id)}
      data-testid={isOldNotification ? 'old-notification' : 'new-notification'}
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
        [styles.isRead]: isOldNotification,
      })}
    >
      <div className={styles.blockTitle}>
        <div className={styles.blockIcon}>
          {icon ? <DappletImage storageRef={icon} className={styles.icon} /> : null}
          <div className={styles.title}>
            <LinkifyText>{title}</LinkifyText>
          </div>
        </div>

        <span className={styles.date}>
          <span>
            {addZero(newDateNum.getFullYear()) +
              '.' +
              addZero(newDateNum.getMonth() + 1) +
              '.' +
              addZero(newDateNum.getDate())}
          </span>
          &nbsp;&nbsp;
          <span>{addZero(newDateNum.getHours()) + ':' + addZero(newDateNum.getMinutes())}</span>
        </span>
        {/* {isRead !== 0 ? (
          <CloseIcon
            appearance="small"
            color="red"
            isNotification
            onClick={() => onClear && onClear(_id)}
          />
        ) : null} */}
      </div>
      <div className={styles.blockDesccription}>
        <div className={styles.blockInfo}>
          <p ref={refComponent} className={cn(styles.description, {})}>
            <LinkifyText>{newDescription}</LinkifyText>
          </p>
        </div>

        {href && (
          <a href="" className={styles.link}>
            Go to store
          </a>
        )}
      </div>

      {status !== NotificationStatus.Resolved && actions?.length > 0 ? (
        <div className={styles.buttonNotificationBlock}>
          {actions.map(({ action, title }) => (
            <button
              className={styles.buttonNotification}
              key={action}
              onClick={(event) => handleActionButtonClick(action, event)}
            >
              {title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
