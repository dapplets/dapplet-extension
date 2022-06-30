import cn from 'classnames'
import React, { ChangeEvent, FC } from 'react'
import { isValidHttp } from '../../../../../popup/helpers'
import styles from './InputPanelSettings.module.scss'

export interface InputPanelSettingsProps
  extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  onSubmit?: () => void
  providerInputError: any
  providerInput: any

  getDefaultValueProvider: any
  setProviderInputError: any
  setProviderInput: any
  setProvider: any
  onPress?: any
  inputOfFocusEtn: any
  isValidHttpFunction: boolean
  isPostStampId: boolean
  isValidPostageStampId?: any
}

export const InputPanelSettings: FC<InputPanelSettingsProps> = (props) => {
  const {
    onSubmit,
    providerInput,
    getDefaultValueProvider,
    setProviderInputError,
    providerInputError,
    setProviderInput,
    setProvider,
    onPress,
    inputOfFocusEtn,
    isValidHttpFunction,
    isPostStampId,
    isValidPostageStampId,
    ...anotherProps
  } = props

  const handlerSubmit = (event: ChangeEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit && onSubmit()
  }

  return (
    <>
      <div
        className={cn(styles.formDefault, styles.formAbsolute, {
          [styles.errorInputDefault]:
            (!!providerInputError && isValidHttpFunction ? !isValidHttp(providerInput) : null) ||
            providerInputError,
        })}
      >
        <form
          style={{ width: '100%' }}
          onBlur={() => {
            setProviderInputError(null)
            if (!isValidHttp(providerInput)) {
              getDefaultValueProvider(providerInput)
            }
            if (providerInput.length === 0) {
              getDefaultValueProvider(providerInput)
            }
          }}
          onFocus={() => {
            setProviderInput('')
            setProviderInputError(null)
          }}
          onSubmit={(e) => {
            e.preventDefault()
            if (isPostStampId) {
              if (isValidPostageStampId(providerInput)) {
                setProvider(providerInput)
              } else if (!isValidPostageStampId(providerInput)) {
                setProviderInputError('Enter valid Swarm Postage Stamp ID')
                getDefaultValueProvider(providerInput)
                setTimeout(() => {
                  setProviderInputError(null)
                }, 3000)
              }
            } else {
              setProvider(providerInput)
              onPress(e, inputOfFocusEtn)
            }
          }}
        >
          <input
            spellCheck={false}
            className={cn(styles.inputDefault, {})}
            value={providerInput || ''}
            ref={inputOfFocusEtn}
            onChange={(e) => {
              setProviderInput(e.target.value)
              setProviderInputError(null)
            }}
          />
        </form>
        <button
          onClick={(e) => {
            e.preventDefault()

            getDefaultValueProvider(providerInput)
          }}
          className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
        />
      </div>
      {providerInputError ? <div className={styles.errorMessage}>{providerInputError}</div> : null}
    </>
  )
}
