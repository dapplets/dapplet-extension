import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import { ReactComponent as DropdownIcon } from '../../assets/icons/iconDropdown.svg'
import useAbortController from '../../hooks/useAbortController'
import styles from './DropdownSettings.module.scss'

type TDropdownSettingsProps = {
  values: { [s: number]: number | string }
  getterName: string
  setterName: string
  event?: string
}

export const DropdownSettings = (props: TDropdownSettingsProps) => {
  const { values, getterName, setterName, event } = props
  const [isOpen, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      getterName && (await loadValueFromStorage())
    }
    init()
    return () => {
      abortController.abort()
    }
  }, [abortController.signal.aborted, getterName])

  const loadValueFromStorage = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const storageValue = await backgroundFunctions[getterName]()

    setSelectedValue(storageValue)
  }

  const writeToStorageSelectedValue = async (value: string, func: (x) => void) => {
    const backgroundFunctions = await initBGFunctions(browser)
    await backgroundFunctions[setterName](value)
    loadValueFromStorage()
    func(false)
    event && EventBus.emit(event)
  }
  return !getterName ? (
    <></>
  ) : (
    <div
      className={styles.wrapper}
      onClick={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <div className={styles.dropdownLabel}>{selectedValue}</div>
      <span className={cn(styles.openList, { [styles.isOpen]: isOpen })}>
        <DropdownIcon />
      </span>
      {isOpen && (
        <div className={styles.openOverlay} data-testid="opened-dropdown">
          <div className={styles.blockIcon}>
            <div className={styles.delimiterSpan}>{'\u2013'}</div>
            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={() => setOpen(false)}
              tabIndex={1}
            >
              <DropdownIcon />
            </span>
          </div>
          {Object.values(values)
            .map((v) => ({ id: v + '', text: v + '' }))
            .map((item) => {
              const { id, text } = item
              return (
                <div
                  data-testid={id}
                  className={cn(styles.item, {
                    [styles.activeItem]: text === selectedValue,
                  })}
                  key={id}
                  onClick={() => {
                    writeToStorageSelectedValue(id, setOpen)
                  }}
                >
                  {text}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
