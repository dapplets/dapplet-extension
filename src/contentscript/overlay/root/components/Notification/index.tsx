import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { CloseIcon } from '../CloseIcon'
import styles from './Notification.module.scss'

export interface NotificationProps {
  label: string
  icon?: string
  title: string
  date: any
  onClear?: (x) => void
  href?: string
  _id: any
  description: any
  isRead?: number
  actions?: NotificationAction[]
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { icon, label, title, date, onClear, _id, description, href, isRead, actions } = props
  const [isDelete, onDelete] = useState(false)
  const [newDescription, setDescription] = useState(description)
  const refComponent = useRef<HTMLInputElement>()
  const newDateNum = new Date(date)

  async function handleActionButtonClick(actionId: string) {
    const { resolveNotificationAction, getThisTab } = await initBGFunctions(browser)
    const thisTab = await getThisTab()
    await resolveNotificationAction(_id, actionId, thisTab.id)
  }

  const addZero = (num) => {
    if (num >= 0 && num <= 9) {
      return '0' + num
    } else {
      return num
    }
  }

  return (
    <div
      data-testid={isRead !== 0 ? 'new-notification' : 'old-notification'}
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
        [styles.isRead]: isRead === 0,
      })}
    >
      <div className={styles.blockTitle}>
        <div className={styles.blockIcon}>
          {icon ? <img src={icon} className={styles.icon} /> : null}
          <h4 className={styles.title}>{title}</h4>
        </div>

        <span className={styles.date}>
          <span>
            {addZero(newDateNum.getFullYear()) +
              '.' +
              addZero(newDateNum.getMonth() + 1) +
              '.' +
              addZero(newDateNum.getDate())}
          </span>{' '}
          <span>{addZero(newDateNum.getHours()) + ':' + addZero(newDateNum.getMinutes())}</span>
        </span>
      </div>
      <div className={styles.blockDesccription}>
        <div className={styles.blockInfo}>
          <p ref={refComponent} className={cn(styles.description, {})}>
            {newDescription}
          </p>
        </div>

        {href && (
          <a href="" className={styles.link}>
            Go to store
          </a>
        )}
        {isRead !== 0 ? (
          <CloseIcon
            appearance="small"
            color="red"
            isNotification
            onClick={() => onClear && onClear(_id)}
          />
        ) : null}
      </div>

      {/* ToDo: design it */}
      {actions?.length > 0 ? (
        <div>
          {actions.map(({ action, title }) => (
            <button key={action} onClick={() => handleActionButtonClick(action)}>
              {title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
