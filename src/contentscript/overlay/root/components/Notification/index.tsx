import cn from 'classnames'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import ReactTimeAgo from 'react-time-ago'
import { CloseIcon } from '../CloseIcon'
import styles from './Notification.module.scss'

TimeAgo.addLocale(en)

export interface NotificationProps {
  label: string

  title: string
  date: any
  onClear?: Function
  href?: string
  _id: any
  description: any
  onChange?: () => void
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { label, title, date, onClear, _id, description, href, onChange } = props
  const refComponent = useRef<HTMLInputElement>()

  const [isDelete, onDelete] = useState(false)

  const [newDescription, setDescription] = useState(description)

  const booleanNode = refComponent.current?.classList.contains('more')

  // refComponent.current?.classList
  // Repeats. Take out as a single function
  useEffect(() => {
    if (description.length > 235) {
      if (refComponent && refComponent.current) {
        refComponent.current?.classList.add(styles.more)

        setDescription(refComponent.current?.innerText.slice(0, 235))
      }
    } else {
      if (refComponent && refComponent.current) {
        refComponent.current?.classList.remove(styles.more)

        setDescription(description)
      }
    }
  }, [refComponent, booleanNode])

  const onClick = (id: string) => (): void => {
    onClear && onClear(id)
    onDelete(true)
  }

  const newDateNum = new Date(date)

  return (
    <div
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
      })}
      onChange={onChange}
    >
      <header className={styles.header}>{label}</header>
      <span className={styles.date}>
        <ReactTimeAgo date={newDateNum} locale="en-US" />
      </span>
      <h4 className={styles.title}>{title}</h4>

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
      <CloseIcon
        appearance="small"
        color="black"
        className={styles.button}
        onClick={onClick(_id)}
      />
    </div>
  )
}
