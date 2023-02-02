import cn from 'classnames'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { CloseIcon } from '../CloseIcon'
import styles from './Notification.module.scss'

TimeAgo.addLocale(en)

export interface NotificationProps {
  label: string
  icon?: string
  title: string
  date: any
  onClear?: Function
  href?: string
  _id: any
  description: any
  onChange?: () => void
}

export const Notification = (props: NotificationProps): ReactElement => {
  const { icon, label, title, date, onClear, _id, description, href, onChange } = props
  const [isDelete, onDelete] = useState(false)
  const [newDescription, setDescription] = useState(description)
  const refComponent = useRef<HTMLInputElement>()
  const newDateNum = new Date(date)
  // console.log(newDateNum);
  const addZero = (num) => {
    if (num >= 0 && num <= 9) {
      return '0' + num
    } else {
      return num
    }
  }
  const booleanNode = refComponent.current?.classList.contains('more')

  useEffect(() => {
    if (description.length > 235) {
      useStyleRef(
        description,
        refComponent,
        setDescription(refComponent.current?.innerText.slice(0, 235))
      )
    } else {
      useStyleRef(description, refComponent, setDescription(description))
    }
  }, [refComponent, booleanNode, description])

  const useStyleRef = (stroke, ref, func) => {
    if (ref && ref.current) {
      stroke.length > 235
        ? ref.current?.classList.add(styles.more)
        : ref.current?.classList.remove(styles.more),
        func
    }
  }

  const onClick = (id: string) => (): void => {
    onClear && onClear(id)
    onDelete(true)
  }

  return (
    <div
      className={cn(styles.wrapper, {
        [styles.delete]: isDelete,
      })}
      onChange={onChange}
    >
      <div className={styles.blockTitle}>
        <div className={styles.blockIcon}>
       { icon? <img src={icon} className={styles.icon} />:null}
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
        <CloseIcon
          appearance="small"
          color="notification"
          className={styles.button}
          onClick={onClick(_id)}
        />
      </div>
    </div>
  )
}
