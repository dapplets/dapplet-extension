import cn from 'classnames'
import React, { DetailedHTMLProps, FC, InputHTMLAttributes } from 'react'
import styles from './Switch.module.scss'

export interface SwitchProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  checked?: boolean
  isLoad?: boolean
}

export const Switch: FC<SwitchProps> = ({ checked = false, onChange, isLoad, ...props }) => {
  return (
    <label className={cn(styles.wrapper)}>
      <input className={cn(styles.input)} type="checkbox" onChange={onChange} {...props} />
      <span
        className={cn(styles.inputCheckbox, {
          [styles.active]: checked,
        })}
      />
    </label>
  )
}
