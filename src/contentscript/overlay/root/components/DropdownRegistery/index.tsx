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
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  // list?: IDropdown[]
  // value?: IDropdown | null
}
let _isMounted = false
export const DropdownRegistery: FC<DropdownRegisteryProps> = (
  props: DropdownRegisteryProps
) => {
  const {
    // list,
    // className,
    // value = null,

    ...anotherProps
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [registries, setRegistries] = useState([])

  // const ethereumReg = new RegExp(/^0x[a-fA-F0-9]{40}$/)
  // const ethReg = new RegExp(/^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+eth$/)
  // const nearReg = new RegExp(
  //   /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+near$/
  // )
  // const nearTestReg = new RegExp(
  //   /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+testnet$/
  // )
  // const nearImplicitAccountsReg = new RegExp(/^[0-9a-z]{64}$/)
  // const nearDevAccountsReg = new RegExp(/^dev-\d*-\d*$/)

  // const [testInput, setTestInput] = useState(false)
  // const getTweetParse = (tweet) => {
  //   if (
  //     !ethereumReg.test(tweet) ||
  //     !ethReg.test(tweet) ||
  //     !nearReg.test(tweet) ||
  //     !nearTestReg.test(tweet) ||
  //     !nearImplicitAccountsReg.test(tweet) ||
  //     !nearDevAccountsReg.test(tweet)
  //   ) {
  //     setTestInput(true)
  //   } else {
  //     setTestInput(false)
  //   }
  // }

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

  //   Ethereum
  // /^0x[a-fA-F0-9]{40}$/

  // ENS
  // /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+eth$/

  // NEAR
  // /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+near$/

  // NEAR TESTNET
  // /^(?:[a-z0-9](?:[a-z0-9-_]{0,61}[a-z0-9])?\.)+testnet$/

  // NEAR Implicit accounts
  // /^[0-9a-z]{64}$/

  // NEAR Dev accounts
  // /^dev-\d*-\d*$/

  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === false))
  }
  const addRegistry = async (url: string, x: () => void) => {
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, false)
      setRegistryInput(registryInput)
      setRegistryInputError(null)
    } catch (err) {
      setRegistryInputError(err.message)
    }

    loadRegistries()
    x()
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

  const visible = (hash: string): string => {
    if (hash.length > 18) {
      const firstFourCharacters = hash.substring(0, 9)
      const lastFourCharacters = hash.substring(
        hash.length - 0,
        hash.length - 8
      )

      return `${firstFourCharacters}...${lastFourCharacters}`
    } else {
      return hash
    }
  }
  const handleClear = () => {
    setRegistryInput('')
  }
  // console.log(registryInputError)

  return (
    <>
      <div
        className={cn(styles.wrapper, {
          [styles.errorInput]: registryInputError,
        })}
        onBlur={setOpen}
        tabIndex={0}
      >
        {registries.map(
          (r, i) =>
            r.isEnabled && (
              <div key={i} className={styles.activeRegistry}>
                <div className={cn(styles.inputBlock)}>
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
                    onClick={() => {
                      // setRegistryInputError(null)
                      addRegistry(registryInput, handleClear)
                    }}
                    onBlur={() => setRegistryInputError(null)}
                  />

                  <span
                    className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                    onClick={setOpen}
                  />
                </div>
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
                  className={cn(styles.registrieslink, {
                    [styles.activeLink]: r.isEnabled,
                  })}
                  onClick={() => {
                    enableRegistry(r.url)
                    setOpen()
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
