import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { StorageRef } from '../../../../../common/types'
import { addZero } from '../../helpers/addZero'
import { CloseIcon } from '../CloseIcon'
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
        {isRead !== 0 ? (
          <CloseIcon
            appearance="small"
            color="red"
            isNotification
            onClick={() => onClear && onClear(_id)}
          />
        ) : null}
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

      {/* ToDo: design it */}
      {actions?.length > 0 ? (
        <div className={styles.buttonNotificationBlock}>
          {actions.map(({ action, title }) => (
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
  )
}
