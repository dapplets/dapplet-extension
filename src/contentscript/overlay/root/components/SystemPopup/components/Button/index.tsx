import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Button.module.scss'
import { ButtonProps } from './Button.props'

export const Button: FC<ButtonProps> = ({ className, children, basic, ...props }: ButtonProps) => {
  return (
    <button
      className={basic === true ? cn(styles.basic, className) : cn(styles.button, className)}
      {...props}
    >
      {children}
    </button>
  )
}
