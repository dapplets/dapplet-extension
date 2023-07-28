import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes } from 'react'
import { ReactComponent as Check } from '../../assets/icons/checkboxOnMainSettingsNotification.svg'
import styles from './Checkbox.module.scss'

export interface CheckboxProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  title: string
  isCheckbox?: boolean
  isSupport?: boolean
  onChange?: (x) => void
  isReadonly?: boolean
  disabled?: boolean
}
export const Checkbox: FC<CheckboxProps> = (props: CheckboxProps) => {
  const {
    title,
    isSupport = false,
    isCheckbox,
    onChange,
    isReadonly,
    disabled,
    ...anotherProps
  } = props

  return (
    <div className={styles.supportBlockCheckbox}>
      <div
        data-title="The centralized storage maintained by Dapplets Project. It backs up your modules in case decentralized storages become unavailable."
        className={cn(styles.checkboxBlock, { [styles.supportLabel]: isSupport })}
      >
        <label className={cn(styles.wrapper)}>
          <input
            disabled={disabled}
            className={cn(styles.inputCheckbox)}
            type="checkbox"
            onChange={onChange}
            checked={isCheckbox}
            readOnly={isReadonly}
            {...anotherProps}
          />
          <span
            className={cn(styles.fakeInputCheckbox, {
              [styles.active]: isCheckbox,
            })}
          >
            <Check />
          </span>
        </label>
        <span className={cn(styles.inputCheckboxTitle)}>{title}</span>
      </div>
    </div>
  )
}
