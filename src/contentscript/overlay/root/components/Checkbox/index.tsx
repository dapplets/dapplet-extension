import React, { FC, DetailedHTMLProps, HTMLAttributes } from 'react'
import cn from 'classnames'
import styles from './Checkbox.module.scss'

export const checkboxList = (): React.ReactElement => (
  <>
    <Checkbox title="System" isCheckbox={true} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
  </>
)

export interface CheckboxProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLLabelElement>,
    HTMLLabelElement
  > {
  title: string
  isCheckbox: boolean
}
export const Checkbox: FC<CheckboxProps> = (props: CheckboxProps) => {
  const { title, isCheckbox, ...anotherProps } = props

  return (
    <label
      className={cn(styles.checkboxNotification, {
        [styles.activeNotification]: isCheckbox,
      })}
      {...anotherProps}
    >
      <input className={cn(styles.inputNotification)} type="checkbox" />
      <div className={styles.inner}>
        <span className={cn(styles.inputCheckbox)} />
        <span className={cn(styles.inputCheckboxTitle)}>{title}</span>
      </div>
    </label>
  )
}
