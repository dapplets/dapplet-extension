import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useState,
} from 'react'
import { INotification } from '../../models/notification.model'
import cn from 'classnames'
import styles from './Notification.module.scss'
import { useToggle } from '../../hooks/useToggle'
import ReactTimeAgo from 'react-time-ago'
import { CloseIcon } from '../CloseIcon'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
TimeAgo.addLocale(en)

export interface NotificationProps {
  label: string
  // message: INotification
  title: string
  date: any
  onClear?: Function
  href?: string
  _id: any
  description: any
  onChange?: () => void
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { label, title, date, onClear, _id, description, href, onChange } =
    props
  const [isOpen, onOpen] = useToggle(false)
  const [isDelete, onDelete] = useState(false)

  const onClick = (id: string) => (): void => {
    onClear && onClear(id)
    onDelete(true)
  }

  // console.log(message.date)
  const newDateNum = new Date(date)
  // console.log(newDateNum)

  return (
    <div
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
      })}
      onChange={onChange}
    >
      <header className={styles.header}>{label}</header>
      <h4 className={styles.title}>
        {title}
        <span
          onClick={onOpen}
          className={cn(styles.toggle, {
            [styles.isOnOpen]: isOpen,
          })}
        />
      </h4>
      <span className={styles.date}>
        <ReactTimeAgo date={newDateNum} locale="en-US" />
      </span>
      {isOpen && <p className={styles.description}>{description}</p>}
      {href && (
        <a href="" className={styles.link}>
          Go to store
        </a>
      )}
      <CloseIcon
        appearance="small"
        color="black"
        className={styles.button}
        onClick={onClick(_id)}
      />
    </div>
  )
}
