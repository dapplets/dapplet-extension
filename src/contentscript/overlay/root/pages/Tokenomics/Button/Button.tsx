import classNames from 'classnames'
import React, { DetailedHTMLProps, FC, ReactElement } from 'react'
import styles from './Button.module.scss'

interface ButtonProps
  extends DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  primary?: boolean
  secondary?: boolean
  outline?: boolean
  link?: boolean
  danger?: boolean
  light?: boolean
  round?: boolean
  lg?: boolean
  sm?: boolean
  sv?: boolean
  className?: string
}

export const Button: FC<ButtonProps> = ({
  primary,
  secondary,
  outline,
  link,
  danger,
  light,
  round,
  lg,
  sm,
  sv,
  className,
  children,
  disabled,
  ...htmlProps
}: ButtonProps): ReactElement => {
  return (
    <button
      className={classNames(
        styles.root,
        { [styles.primary]: primary },

        { [styles.outline]: outline },
        { [styles.link]: link },
        { [styles.danger]: danger },
        { [styles.light]: light },
        { [styles.lg]: lg },
        { [styles.sm]: sm },
        { [styles.sv]: sv },
        { [styles.round]: round },
        { [styles.disabled]: disabled },
        className
      )}
      {...htmlProps}
    >
      {children}
    </button>
  )
}

export default Button
