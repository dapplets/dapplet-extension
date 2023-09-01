import cn from 'classnames'
import React, { useRef } from 'react'
import { ReactComponent as Delete } from '../../assets/icons/mini-close.svg'
import styles from './Input.module.scss'

export type InputProps = {
  value: string
  error?: string
  placeholder?: string
  onChange: (value: string) => void
  onError?: (error: string) => void
}

export const Input: React.FC<InputProps> = ({ value, error, placeholder, onChange, onError }) => {
  const inputRef = useRef<HTMLInputElement>()

  return (
    <>
      <form
        onBlur={() => {
          error ? onError?.(null) : null
        }}
        onSubmit={(e) => {
          e.preventDefault()
          onChange(value)
          inputRef.current?.blur()
        }}
        className={cn(styles.formDefault, {
          [styles.errorInputDefault]: error,
        })}
      >
        <input
          spellCheck={false}
          className={cn(styles.inputDefault, {})}
          placeholder={placeholder}
          ref={inputRef}
          value={value}
          onFocus={() => {
            error ? onError?.(null) : null
          }}
          onChange={(e) => {
            onChange(e.target.value)
            onError?.(null)
          }}
        />
        {value && <Delete onClick={() => onChange('')} className={styles.deleteUserAgentName} />}
      </form>
      {error ? <div className={styles.errorMessage}>{error}</div> : null}
    </>
  )
}
