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
import styles from './DropdownRegistery.module.scss'

import { useToggle } from '../../hooks/useToggle'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { isValidUrl } from '../../../../../popup/helpers'

export interface DropdownRegisteryProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}
let _isMounted = false
export const DropdownRegistery: FC<DropdownRegisteryProps> = (
  props: DropdownRegisteryProps
) => {
  const { ...anotherProps } = props
  const [isOpen, setOpen] = useState(false)
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [registries, setRegistries] = useState([])

  const regExpIndexNearTestnet = new RegExp(
    /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+testnet$/
  )
  const regExpIndexNear = new RegExp(
    /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+near$/
  )
  const regExpIndexENS = new RegExp(
    /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+eth$/
  )
  const regExpIndexEthereum = new RegExp(/^0x[a-fA-F0-9]{40}$/)
  const regExpIndexNEARImplicit = new RegExp(/^[0-9a-z]{64}$/)
  const regExpIndexNEARDev = new RegExp(/^dev-\d*-\d*$/)

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
  const getNumIndex = (value, reg) => {
    try {
      let numEl = value.match(reg)

      return numEl
    } catch {}
  }

  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === false))
  }
  const addRegistry = async (url: string, x: () => void) => {
    const { addRegistry } = await initBGFunctions(browser)
    const valueParse = getNumIndex(registryInput, regExpIndexEthereum)
    const valueParseNEARImplicit = getNumIndex(
      registryInput,
      regExpIndexNEARImplicit
    )
    const valueParseNEARDev = getNumIndex(registryInput, regExpIndexNEARDev)
    const valueParseENS = getNumIndex(registryInput, regExpIndexENS)
    const valueParseNear = getNumIndex(registryInput, regExpIndexNear)
    const valueParseNearTestnet = getNumIndex(
      registryInput,
      regExpIndexNearTestnet
    )
    if (
      valueParse !== null ||
      valueParseNEARImplicit !== null ||
      valueParseNEARDev !== null ||
      valueParseENS !== null ||
      valueParseNear !== null ||
      valueParseNearTestnet !== null
    ) {
      try {
        await addRegistry(url, false)
        setRegistryInput(registryInput)
        setRegistryInputError(null)
      } catch (err) {
        setRegistryInputError(err.message)
      }

      loadRegistries()
      x()
    } else {
      setRegistryInputError('Enter valid Registry')
    }
  }
  const removeRegistry = async (url: string) => {
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
  }

  const enableRegistry = async (url: string, x: (x) => void) => {
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    loadRegistries()
    x(false)
  }

  const visible = (hash: string): string => {
    if (hash.length > 38) {
      const firstFourCharacters = hash.substring(0, 20)
      const lastFourCharacters = hash.substring(
        hash.length - 0,
        hash.length - 18
      )

      return `${firstFourCharacters}...${lastFourCharacters}`
    } else {
      return hash
    }
  }
  const handleClear = () => {
    setRegistryInput('')
  }

  return (
    <>
      <div
        className={cn(styles.wrapper, {
          [styles.errorInput]: registryInputError,
        })}
        onBlur={() => {
          handleClear()
          setOpen(false)
        }}
        tabIndex={0}
      >
        {registries.map(
          (r, i) =>
            r.isEnabled && (
              <div key={i} className={styles.activeRegistry}>
                <form
                  className={cn(styles.inputBlock)}
                  onSubmit={(e) => {
                    e.preventDefault()

                    addRegistry(registryInput, handleClear)
                  }}
                  onBlur={() => setRegistryInputError(null)}
                >
                  <input
                    className={cn(styles.inputRegistries)}
                    disabled={
                      !isValidUrl(registryInput) &&
                      !!registries.find((r) => r.url === !registryInput)
                    }
                    placeholder={r.url}
                    value={registryInput}
                    onChange={(e) => {
                      setRegistryInput(e.target.value)
                      setRegistryInputError(null)
                    }}
                  />

                  <span
                    className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                    onClick={() => setOpen(true)}
                  />
                </form>
              </div>
            )
        )}

        {isOpen && (
          <div className={styles.registriesList}>
            <div className={styles.inputBlock}>
              <div className={styles.delimiterSpan}>-</div>
              <span
                className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                onClick={() => setOpen(false)}
              />
            </div>

            {registries.map((r, i) => (
              <div key={i} className={styles.itemRegistries}>
                <span
                  className={cn(styles.registrieslink, {
                    [styles.activeLink]: r.isEnabled,
                  })}
                  onClick={() => {
                    enableRegistry(r.url, setOpen)
                  }}
                >
                  {visible(r.url)}
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
      {registryInputError ? (
        <div className={styles.errorMessage}>{registryInputError}</div>
      ) : null}
    </>
  )
}

// registry.dapplet-base.eth
// dev-1627024020035-70641704943070
