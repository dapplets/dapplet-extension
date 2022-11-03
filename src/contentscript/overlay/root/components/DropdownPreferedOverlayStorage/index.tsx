import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import useAbortController from '../../hooks/useAbortController'
import { IDropdown } from '../../models/dropdown.model'
import styles from './DropdownPreferedOverlayStorage.module.scss'

export interface DropdownProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
  handlerChangeValue?: (value: IDropdown | null) => void
}

export const DropdownPreferedOverlayStorage: FC<DropdownProps> = (props: DropdownProps) => {
  const [isOpen, setOpen] = useState(false)
  const [preferedOverlayStorage, setPreferedOverlayStorage] = useState('')
  const { list, className, value = null, handlerChangeValue, title, ...anotherProps } = props
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      await loadPreferedOverlayStorage()
    }
    init()
    return () => {
      // abortController.abort()
    }
  }, [abortController.signal.aborted])

  const loadPreferedOverlayStorage = async () => {
    const { getPreferedOverlayStorage } = await initBGFunctions(browser)
    const preferedOverlayStorage = await getPreferedOverlayStorage()
    if (!abortController.signal.aborted) {
      setPreferedOverlayStorage(preferedOverlayStorage)
    }
  }

  const selectPreferedOverlayStorage = async (storage: string, func: (x) => void) => {
    const { setPreferedOverlayStorage } = await initBGFunctions(browser)
    await setPreferedOverlayStorage(storage)
    loadPreferedOverlayStorage()
    func(false)
  }
  return (
    <div
      className={styles.wrapper}
      onClick={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <div className={styles.dropdownLabel}>{preferedOverlayStorage}</div>
      <span className={cn(styles.openList, { [styles.isOpen]: isOpen })} />
      {isOpen && (
        <div className={styles.openOverlay}>
          <div className={styles.blockIcon}>
            <div className={styles.delimiterSpan}>{'\u2013'}</div>
            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={() => setOpen(false)}
              tabIndex={1}
            />
          </div>
          {[
            { id: 'centralized', text: 'centralized' },
            { id: 'decentralized', text: 'decentralized' },
          ].map((item) => {
            const { id, text } = item
            return (
              <div
                className={cn(styles.item, {
                  [styles.activeItem]: text === preferedOverlayStorage,
                })}
                key={id}
                onClick={() => {
                  selectPreferedOverlayStorage(id, setOpen)
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
