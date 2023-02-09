import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC } from 'react'
import { ReactComponent as Close } from '../../assets/icons/close-notification-mini.svg'
import { ReactComponent as CloseNotification } from '../../assets/icons/notificationIcons/closeNotification.svg'
import styles from './CloseIcon.module.scss'

export interface CloseIconProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  appearance: 'small' | 'big'
  color: 'black' | 'red' | 'notification'
}

export const CloseIcon: FC<CloseIconProps> = (props: CloseIconProps) => {
  const { appearance, color, className, onClick } = props

  return (
    <button className={cn(styles.button, className)} onClick={onClick}>
      {color === 'notification' ? (
        <CloseNotification className={styles.notification} />
      ) : (
        <Close
          className={cn({
            [styles.small]: appearance === 'small',
            [styles.big]: appearance === 'big',
            [styles.red]: color === 'red',
            [styles.black]: color === 'black',
          })}
        />
      )}
    </button>
  )
}
