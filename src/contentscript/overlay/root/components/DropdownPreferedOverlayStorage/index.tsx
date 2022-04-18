import React, {
  FC,
  FunctionComponent,
  ReactNode,
  HTMLAttributes,
  DetailedHTMLProps,
  useState,
  useEffect,
} from 'react'
import cn from 'classnames'
import styles from './DropdownPreferedOverlayStorage.module.scss'

import { IDropdown } from '../../models/dropdown.model'
import { useToggle } from '../../hooks/useToggle'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { isValidUrl } from '../../../../../popup/helpers'

export interface DropdownProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
  handlerChangeValue?: (value: IDropdown | null) => void
}
let _isMounted = false
export const DropdownPreferedOverlayStorage: FC<DropdownProps> = (
  props: DropdownProps
) => {
  const [isOpen, setOpen] = useState(false)
  const [preferedOverlayStorage, setPreferedOverlayStorage] = useState('')
  const {
    list,
    className,
    value = null,
    handlerChangeValue,
    title,
    ...anotherProps
  } = props
  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await loadPreferedOverlayStorage()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [])

  const loadPreferedOverlayStorage = async () => {
    const { getPreferedOverlayStorage } = await initBGFunctions(browser)
    const preferedOverlayStorage = await getPreferedOverlayStorage()
    setPreferedOverlayStorage(preferedOverlayStorage)
  }

  const selectPreferedOverlayStorage = async (
    storage: string,
    x: (x) => void
  ) => {
    const { setPreferedOverlayStorage } = await initBGFunctions(browser)
    await setPreferedOverlayStorage(storage)
    loadPreferedOverlayStorage()
    x(false)
  }
  return (
    <div
      className={styles.wrapper}
      onClick={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <div className={styles.dropdownLabel}>{preferedOverlayStorage}</div>
      <span className={styles.openDropdown} />
      {isOpen && (
        <div className={styles.openOverlay}>
          <div className={styles.blockIcon}>
            <span
              className={styles.closeDropdown}
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
                  // setOpen(false)
                }}
                // tabIndex={2}
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