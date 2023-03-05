import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes } from 'react'
import styles from './radioButtons.module.scss'
export interface RadioButtonsProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  name?: string
  id?: string
  value?: string
  checked?: any
}
export const RadioButtons: FC<RadioButtonsProps> = (props: RadioButtonsProps) => {
  const { name, id, value, ...anotherProps } = props
  return (
    <div className={cn(styles.form_radio)}>
      <input    
        type="radio"
        name={name}
        id={id}
        value={value}
        {...anotherProps}
      />
      <label htmlFor={id} className={cn(styles.inputRadioTitle)}>
        {value}
      </label>
    </div>
  )
}
