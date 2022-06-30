import cn from 'classnames'
import React, { FC, useEffect } from 'react'
import { parseModuleName } from '../../../../../common/helpers'
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
  isDefaultValueInput: any
  isDynamycAdapter: boolean
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
    isDefaultValueInput,
    isDynamycAdapter,
    ...anotherProps
  } = props
  useEffect(() => {}, [isDefaultValueInput])
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
            if (isDynamycAdapter) {
              if (
                parseModuleName(providerInput).branch === null ||
                parseModuleName(providerInput).name === null ||
                parseModuleName(providerInput).version === null
              ) {
                getDefaultValueProvider(providerInput)
              }
              if (providerInput.length === 0) {
                getDefaultValueProvider(providerInput)
              }
            } else {
              if (!isValidHttp(providerInput)) {
                getDefaultValueProvider(providerInput)
              }
              if (providerInput.length === 0) {
                getDefaultValueProvider(providerInput)
              }
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
            } else if (isDynamycAdapter) {
              setProvider(providerInput)
              if (
                parseModuleName(providerInput).name !== null &&
                parseModuleName(providerInput).version !== null
              ) {
                setProvider(providerInput)
              } else if (
                parseModuleName(providerInput).branch === null ||
                parseModuleName(providerInput).name === null ||
                parseModuleName(providerInput).version === null
              ) {
                setProviderInputError('Enter a valid value')
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
            onFocus={() => {
              if (isDynamycAdapter) {
                setProviderInput('')
                setProviderInputError(null)
              } else {
                return null
              }
            }}
            placeholder={isDynamycAdapter ? providerInput : null}
            onChange={(e) => {
              setProviderInput(e.target.value)
              setProviderInputError(null)
            }}
          />
        </form>
        {isDefaultValueInput !== providerInput && (
          <button
            onClick={(e) => {
              e.preventDefault()

              getDefaultValueProvider(providerInput)
            }}
            className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
          />
        )}
      </div>
      {providerInputError ? <div className={styles.errorMessage}>{providerInputError}</div> : null}
    </>
  )
}
