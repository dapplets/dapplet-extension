import React, { FC, useEffect } from 'react'
import { InputHTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './Switch.module.scss'

export interface SwitchProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  checked?: boolean
  isLoad?: boolean
}

export const Switch: FC<SwitchProps> = ({
  checked = false,
  onChange,
  isLoad,
  ...props
}) => {
  // useEffect(() => {}, [])
  return (
    <label className={cn(styles.wrapper)}>
      <input
        className={cn(styles.input)}
        type="checkbox"
        onChange={onChange}
        {...props}
      />
      <span
        className={cn(styles.inputCheckbox, {
          [styles.active]: checked,
        })}
      />
    </label>
  )
}
