import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
} from 'react'
import { INotification } from '../../models/notification.model'
import cn from 'classnames'
import styles from './Notification.module.scss'
import { useToggle } from '../../hooks/useToggle'

import { CloseIcon } from '../CloseIcon'

export interface NotificationProps {
  label: string
  message: INotification
  onClear?: (id: string) => void
  href?: string
  onChange?: () => void
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { label, message, onClear, href, onChange } = props

  const onClick = (id: string) => (): void => onClear && onClear(id)

  return (
    <div className={styles.wrapper} onChange={onChange}>
      <header className={styles.header}>{label}</header>
      <h4 className={styles.title}>{message.title}</h4>
      <span className={styles.date}>{message.date}</span>
      <p className={styles.description}>{message.description}</p>
      {href && (
        <a href="" className={styles.link}>
          Go to store
        </a>
      )}
      <CloseIcon
        appearance="small"
        color="black"
        className={styles.button}
        onClick={onClick(message._id)}
      />
    </div>
  )
}
