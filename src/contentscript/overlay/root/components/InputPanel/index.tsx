import React, { ChangeEvent, FC } from 'react'
import { InputHTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './InputPanel.module.scss'

export interface InputPanelProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  onSubmit?: () => void
  value?: string
  placeholder?: string
  error?: Boolean
}

export const InputPanel: FC<InputPanelProps> = (props) => {
  const {
    value,
    onChange,
    onSubmit,
    placeholder,
    error = false,
    // onClick,
    ...anotherProps
  } = props
  const handlerSubmit = (event: ChangeEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit && onSubmit()
  }

  return (
    <form className={cn(styles.inputPanel)} onSubmit={handlerSubmit}>
      <input
        value={value}
        className={cn(styles.inputInfo, error && styles.error)}
        onChange={onChange}
        type="text"
        placeholder={placeholder}
        {...anotherProps}
      />
      <button className={cn(styles.inputButton)} type="submit">
        Save
      </button>
    </form>
  )
}
