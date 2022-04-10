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
import styles from './DropdownSettings.module.scss'
import { IDropdown } from '../../models/dropdown.model'
import { useToggle } from '../../hooks/useToggle'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { isValidUrl } from '../../../../../popup/helpers'

let _isMounted = false
export const DropdownSettings: FC<DropdownProps> = (props: DropdownProps) => {
  const {
    list,
    className,
    value = null,

    ...anotherProps
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState('')
  const [registries, setRegistries] = useState([])
  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await loadRegistries()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [])

  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === false))
  }
  const addRegistry = async (url: string) => {
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, false)
      setRegistryInput(registryInput)
    } catch (err) {
      setRegistryInputError(err.message)
    }

    loadRegistries()
  }
  const removeRegistry = async (url: string) => {
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
  }

  const enableRegistry = async (url: string) => {
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    loadRegistries()
  }
  // addRegistry{registryInput}

  return (
    <div className={styles.wrapper}>
      {registries.map(
        (r, i) =>
          (r.isEnabled || registryInput) && (
            <div key={i} className={styles.activeRegistry}>
              <div className={styles.inputBlock}>
                <input
                  className={cn(styles.inputRegistries, {
                    [styles.errorInput]: registryInputError,
                  })}
                  onClick={() => addRegistry(registryInput)}
                  placeholder={r.url}
                  value={registryInput}
                  onChange={(e) => {
                    setRegistryInput(e.target.value)
                    setRegistryInputError(null)
                    enableRegistry(r.url)
                    // addRegistry(registryInput)
                  }}
                  // error={!!registryInputError}
                />

                <span
                  className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                  onClick={setOpen}
                />
              </div>
              {registryInputError ? (
                <div className={styles.errorMessage}>{registryInputError}</div>
              ) : null}
            </div>
          )
      )}

      {isOpen && (
        <div className={styles.registriesList}>
          <div className={styles.inputBlock}>
            <div className={styles.delimiterSpan}>-</div>
            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={setOpen}
            />
          </div>

          {registries.map((r, i) => (
            <div key={i} className={styles.itemRegistries}>
              <span
                className={styles.registrieslink}
                onClick={() => {
                  enableRegistry(r.url)
                  setOpen()
                }}
              >
                {r.url}
              </span>
              {!r.isEnabled && (
                <span
                  onClick={() => removeRegistry(r.url)}
                  className={styles.deleteRegistryes}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export interface DropdownProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
}
// registry.dapplet-base.eth
// dev-1627024020035-70641704943070
