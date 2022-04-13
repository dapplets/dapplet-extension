import React, { ChangeEvent, FC, useState } from 'react'
import { InputHTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './InputPanel.module.scss'

export interface InputPanelProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  onSubmit?: () => void
  value?: string
  placeholder?: string
  error?: boolean
  buttonDefault?: boolean
}

export const InputPanel: FC<InputPanelProps> = (props) => {
  const {
    value = '',
    onChange,
    onSubmit,
    placeholder,
    error = false,
    buttonDefault = false,
    // onClick,
    ...anotherProps
  } = props
  // const [baseState, setBaseState] = useState(value)
  const handlerSubmit = (event: ChangeEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit && onSubmit()
  }

  // const returnValue = (baseStat) => {
  //   const baseState = JSON.stringify(value)
  //   setBaseState(baseState)
  // }

  return (
    <form
      className={cn(styles.inputPanel, { [styles.error]: error })}
      onSubmit={handlerSubmit}
    >
      <input
        className={cn(styles.inputInfo, {
          [styles.inputDefault]: buttonDefault,
        })}
        onChange={onChange}
        // type="text"
        //  value={value}
        placeholder={placeholder}
        {...anotherProps}
      />
      <button
        className={cn(styles.inputButton, {
          [styles.buttonDefault]: buttonDefault,
        })}
        // onClick={() => returnValue(baseState)}
        // type="button"
        type="submit"
      >
        {buttonDefault && 'ADD'}
      </button>
    </form>
  )
}
