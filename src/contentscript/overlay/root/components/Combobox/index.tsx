import cn from 'classnames'
import React, { FC, useState } from 'react'
import { ReactComponent as DropdownIcon } from '../../assets/icons/iconDropdown.svg'
import styles from './Combobox.module.scss'

export type ComboboxProps = {
  value: string
  onChange: (value: string) => void
  options: string[]
  error?: string
}

export const Combobox: FC<ComboboxProps> = ({ value, onChange, options, error }: ComboboxProps) => {
  const [isOpen, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleClear = () => {
    setInputValue('')
  }

  return (
    <>
      <div
        className={cn(styles.wrapper, {
          [styles.errorInput]: error,
        })}
        onBlur={() => {
          handleClear()
          setOpen(false)
        }}
        tabIndex={0}
      >
        <div className={styles.activeRegistry}>
          <form
            className={cn(styles.inputBlock)}
            onSubmit={(e) => {
              e.preventDefault()
              onChange(inputValue)
            }}
            // onBlur={() => setError(null)}
          >
            <input
              className={cn(styles.inputRegistries)}
              // disabled={!isValidUrl(inputValue) && !!registries.find((r) => r.url === !inputValue)}
              placeholder={value}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                // setError(null)
              }}
            />

            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={() => setOpen(true)}
            >
              <DropdownIcon />
            </span>
          </form>
        </div>

        {isOpen && (
          <div className={styles.registriesList}>
            <div className={styles.inputBlock}>
              <div className={styles.delimiterSpan}>{'\u2013'}</div>
              <span
                className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                onClick={() => setOpen(false)}
              >
                <DropdownIcon />
              </span>
            </div>

            {options.map((option) => (
              <div key={option} className={cn(styles.itemRegistries)}>
                <span
                  className={cn(styles.registrieslink, {})}
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  {option}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error ? <div className={styles.errorMessage}>{error}</div> : null}
    </>
  )
}
