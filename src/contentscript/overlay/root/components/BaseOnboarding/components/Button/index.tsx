import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Button.module.scss'

export type ButtonProps = {
  big?: boolean
  label: string
  onClick: () => void
}

export const Button: FC<ButtonProps> = (props: ButtonProps) => {
  const { label, big, onClick: onNext } = props

  return (
    <button
      onClick={onNext}
      className={cn(styles.default, {
        [styles.big]: big,
      })}
    >
      {label}
    </button>
  )
}
