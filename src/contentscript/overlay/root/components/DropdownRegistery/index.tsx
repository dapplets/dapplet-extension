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
import { IDropdown } from '../../models/dropdown.model'
import { useToggle } from '../../hooks/useToggle'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { isValidUrl } from '../../../../../popup/helpers'

export interface DropdownRegisteryProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
}
let _isMounted = false
export const DropdownRegistery: FC<DropdownRegisteryProps> = (
  props: DropdownRegisteryProps
) => {
  const {
    list,
    className,
    value = null,

    ...anotherProps
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
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
  // const isNumeric = () => {
  //   const nearReg = new RegExp(
  //     /^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/
  //   )
  //   const ephirReg = new RegExp(/^0x[a-fA-F0-9]{40}$/)
  //   const defReg = new RegExp(
  //     /[-a-zA-Z0-9@:%.+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&//=]*) /
  //   )
  //   return (
  //     nearReg.test(registryInput) ||
  //     ephirReg.test(registryInput) ||
  //     defReg.test(registryInput)
  //   )
  // }
  // console.log(isNumeric())
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

  return (
    <>
      <div
        className={cn(styles.wrapper, {
          [styles.errorInput]: !!registryInputError,
        })}
        // onClick={() => {
        //   if (isOpen) {
        //     !isOpen
        //   }
        // }}
      >
        {registries.map(
          (r, i) =>
            r.isEnabled && (
              <div key={i} className={styles.activeRegistry}>
                <div className={cn(styles.inputBlock)}>
                  <input
                    className={cn(styles.inputRegistries)}
                    onClick={() => addRegistry(registryInput)}
                    placeholder={r.url}
                    value={registryInput}
                    onChange={(e) => {
                      setRegistryInput(e.target.value)
                      setRegistryInputError(null)
                      enableRegistry(r.url)
                      // addRegistry(registryInput)
                    }}
                    disabled={
                      !isValidUrl(registryInput) &&
                      !!registries.find((r) => r.url === !registryInput)
                    }
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
                  className={styles.registrieslink}
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
