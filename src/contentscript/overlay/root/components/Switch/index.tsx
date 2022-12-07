import cn from 'classnames'
import React, { DetailedHTMLProps, FC, InputHTMLAttributes } from 'react'
import styles from './Switch.module.scss'

export interface SwitchProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  checked?: boolean
  isLoad?: boolean
  className?: string
}

export const Switch: FC<SwitchProps> = ({
  checked = false,
  onChange,
  isLoad,
  className,
  ...props
}) => {
  return (
    <label data-testid="activation-dapplet" className={cn(styles.wrapper, className)}>
      <input className={cn(styles.input)} type="checkbox" onChange={onChange} {...props} />
      <span
        className={cn(styles.inputCheckbox, {
          [styles.active]: checked,
        })}
      />
    </label>
  )
}
