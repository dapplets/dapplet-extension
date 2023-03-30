import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Button.module.scss'

export type ButtonProps = {
  big?: boolean
  value: string
  onNext: () => void
}

export const Button: FC<ButtonProps> = (props: ButtonProps) => {
  const { value, big, onNext } = props

  return (
    <button
      onClick={onNext}
      className={cn(styles.default, {
        [styles.big]: big,
      })}
    >
      {value}
    </button>
  )
}
