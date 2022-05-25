import React, { FC, FunctionComponent } from 'react'
import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './SquaredButton.module.scss'

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  disabled?: boolean
  appearance: 'smail' | 'big'
  icon: FunctionComponent
}

export const SquaredButton: FC<ButtonProps> = (props: ButtonProps) => {
  const {
    disabled = false,
    appearance,
    className,
    icon: Icon,

    ...anotherProps
  } = props
  return (
    <button
      className={cn(
        styles.button,
        {
          [styles.smail]: appearance === 'smail',
          [styles.big]: appearance === 'big',
        },
        className
      )}
      {...anotherProps}
      disabled={disabled}
    >
      <Icon />
    </button>
  )
}
