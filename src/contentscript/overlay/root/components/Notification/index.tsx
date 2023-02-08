import cn from 'classnames'
// import TimeAgo from 'javascript-time-ago'
import React, { ReactElement, useRef, useState } from 'react'
import { CloseIcon } from '../CloseIcon'
import styles from './Notification.module.scss'

// TimeAgo.addLocale(en)

export interface NotificationProps {
  label: string
  icon?: string
  title: string
  date: any
  onClear?: any
  href?: string
  _id: any
  description: any
  onChange?: any
  isRead?: any
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { icon, label, title, date, onClear, _id, description, href, onChange, isRead } = props
  const [isDelete, onDelete] = useState(false)
  const [newDescription, setDescription] = useState(description)
  const refComponent = useRef<HTMLInputElement>()
  const newDateNum = new Date(date)
  const addZero = (num) => {
    if (num >= 0 && num <= 9) {
      return '0' + num
    } else {
      return num
    }
  }

  return (
    <div
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
        [styles.isRead]: isRead === 0,
      })}
      // onClick={() => onChange && onChange(_id)}
    >
      <div className={styles.blockTitle}>
        <div className={styles.blockIcon}>
          {icon ? <img src={icon} className={styles.icon} /> : null}
          <h4 className={styles.title}>{title}</h4>
        </div>

        <span className={styles.date}>
          {/* <ReactTimeAgo date={newDateNum} locale="en-US" /> */}
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
      {/* <header className={styles.header}>{label}</header> */}
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
            color="notification"
            className={styles.button}
            onClick={() => onClear && onClear(_id)}
          />
        ) : null}
      </div>
    </div>
  )
}
