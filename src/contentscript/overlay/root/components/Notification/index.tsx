import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useState,
  useRef,
  useEffect,
} from 'react'
import { INotification } from '../../models/notification.model'
import cn from 'classnames'
import styles from './Notification.module.scss'
import { useToggle } from '../../hooks/useToggle'
import ReactTimeAgo from 'react-time-ago'
import { CloseIcon } from '../CloseIcon'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { on } from 'process'
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
  const refComponent = useRef<HTMLInputElement>()
  const [isOpen, onOpen] = useState(false)
  const [isDelete, onDelete] = useState(false)
  const [isMoreInformation, onMoreInformation] = useToggle(false)

  const booleanNode = refComponent.current?.classList.contains('more')
  useEffect(() => {
    if (description.length > 71) {
      if (refComponent && refComponent.current) {
        refComponent.current?.classList.add('more')
        // if (booleanNode === true) {
        onOpen(true)
        // }
      }
    } else {
      if (refComponent && refComponent.current) {
        refComponent.current?.classList.remove('more')
        onOpen(false)
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
      <h4 className={styles.title}>{title}</h4>
      <span className={styles.date}>
        <ReactTimeAgo date={newDateNum} locale="en-US" />
      </span>
      <div className={styles.blockInfo}>
        <p
          ref={refComponent}
          className={cn(styles.description, {
            [styles.descriptionMore]: isOpen,
            [styles.moreInformation]: isMoreInformation,
          })}
          onClick={() => {
            isMoreInformation && onMoreInformation()
          }}
        >
          {description}
        </p>{' '}
        {isOpen && (
          <span
            className={cn(styles.moreDescription, {
              [styles.deleteEllipsis]: isMoreInformation,
            })}
            onClick={onMoreInformation}
          >
            ...
          </span>
        )}
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
