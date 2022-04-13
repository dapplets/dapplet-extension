import React, { FC, DetailedHTMLProps, HTMLAttributes } from 'react'
import cn from 'classnames'
import styles from './Checkbox.module.scss'

export interface CheckboxProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLLabelElement>,
    HTMLLabelElement
  > {
  title: string
  isCheckbox: boolean
  // onChange?: (any, any) => void
}
export const Checkbox: FC<CheckboxProps> = (props: CheckboxProps) => {
  const { title, isCheckbox = false, onChange, ...anotherProps } = props
  // const onChangeCheckbox = (x, y) => {}
  return (
    <label
      onChange={onChange}
      className={cn(styles.checkboxNotification, {
        [styles.activeNotification]: isCheckbox,
      })}
      {...anotherProps}
    >
      <input
        // onChange={() => onChange}
        className={cn(styles.inputNotification)}
        type="checkbox"
      />
      <div className={styles.inner}>
        <span className={cn(styles.inputCheckbox)} />
        <span className={cn(styles.inputCheckboxTitle)}>{title}</span>
      </div>
    </label>
  )
}
