import cn from 'classnames'
import React, { ButtonHTMLAttributes, DetailedHTMLProps, FC, FunctionComponent } from 'react'
import styles from './SquaredButton.module.scss'

export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  disabled?: boolean
  appearance: 'smail' | 'big'
  icon: FunctionComponent
  dataTestid?: string
}

export const SquaredButton: FC<ButtonProps> = (props: ButtonProps) => {
  const {
    disabled = false,
    appearance,
    className,
    icon: Icon,
    dataTestid,

    ...anotherProps
  } = props
  return (
    <button
      data-testid={dataTestid}
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
