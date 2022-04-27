import React, {
  FC,
  FunctionComponent,
  ReactNode,
  HTMLAttributes,
  DetailedHTMLProps,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './DropdownTrustedUsers.module.scss'
import { IDropdown } from '../../models/dropdown.model'
import { useToggle } from '../../hooks/useToggle'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
// import { isValidUrl,typeOfUri } from '../../../../../popup/helpers'
import { isValidUrl } from '../../../../../popup/helpers'
import { typeOfUri, UriTypes } from '../../../../../common/helpers'

export interface DropdownTrustedProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
}
let _isMounted = false
export const DropdownTrustedUsers: FC<DropdownTrustedProps> = (
  props: DropdownTrustedProps
) => {
  const {
    list,
    className,
    value = null,

    ...anotherProps
  } = props
  const [isOpen, setOpen] = useState(false)
  const [trustedUserInput, setTrustedUserInput] = useState('')
  const [trustedUserInputError, setTrustedUserInputError] = useState(null)
  const [trustedUsers, setTrustedUsers] = useState([])
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
      await loadTrustedUsers()
      await loadRegistries()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [trustedUserInput])

  const getNumIndex = (value, reg) => {
    try {
      let numEl = value.match(reg)
      console.log(numEl)
      return numEl
    } catch {}
  }

  const addTrustedUser = async (account: string, x: () => void) => {
    const { addTrustedUser } = await initBGFunctions(browser)
    const valueParse = getNumIndex(trustedUserInput, regExpIndexEthereum)
    const valueParseNEARImplicit = getNumIndex(
      trustedUserInput,
      regExpIndexNEARImplicit
    )
    const valueParseNEARDev = getNumIndex(trustedUserInput, regExpIndexNEARDev)
    const valueParseENS = getNumIndex(trustedUserInput, regExpIndexENS)
    const valueParseNear = getNumIndex(trustedUserInput, regExpIndexNear)
    const valueParseNearTestnet = getNumIndex(
      trustedUserInput,
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
        await addTrustedUser(account)
        setTrustedUserInput(trustedUserInput)
      } catch (err) {
        setTrustedUserInputError(err.message)
      }

      loadTrustedUsers()
      x()
    } else {
      setTrustedUserInputError('Enter valid Trusted User')
    }
  }

  const removeTrustedUser = async (account: string) => {
    const { removeTrustedUser } = await initBGFunctions(browser)
    await removeTrustedUser(account)
    loadTrustedUsers()
  }
  const loadTrustedUsers = async () => {
    const { getTrustedUsers } = await initBGFunctions(browser)
    const trustedUsers = await getTrustedUsers()
    setTrustedUsers(trustedUsers)
  }
  const _openEtherscan = async (address: string) => {
    if (typeOfUri(address) === UriTypes.Ens) {
      const { resolveName } = await initBGFunctions(browser)
      const ethAddress = await resolveName(address)
      window.open(`https://goerli.etherscan.io/address/${ethAddress}`, '_blank')
    } else if (typeOfUri(address) === UriTypes.Ethereum) {
      window.open(`https://goerli.etherscan.io/address/${address}`, '_blank')
    } else if (typeOfUri(address) === UriTypes.Near) {
      window.open(
        `https://explorer.testnet.near.org/accounts/${address}`,
        '_blank'
      )
    }
  }
  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === false))
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
    setTrustedUserInput('')
  }

  return (
    <>
      <div
        className={cn(styles.wrapper, {
          [styles.errorInput]: trustedUserInputError,
        })}
        onBlur={() => {
          handleClear()
          setOpen(false)
        }}
        tabIndex={0}
      >
        <div className={styles.inputTrustedUsers}>
          <form
            className={styles.inputBlock}
            onSubmit={(e) => {
              e.preventDefault()
              // getNumIndex(trustedUserInput, regExpIndexEthereum)
              addTrustedUser(trustedUserInput, handleClear)
              console.log('click')
            }}
          >
            <input
              className={cn(styles.inputUsers)}
              placeholder="NEAR or Ethereum address..."
              value={trustedUserInput}
              onBlur={() => setTrustedUserInputError(null)}
              onChange={(e) => {
                setTrustedUserInput(e.target.value)
                setTrustedUserInputError(null)
                console.log('change')
              }}
              disabled={
                !isValidUrl(trustedUserInput) &&
                !!registries.find((r) => r.url === !trustedUserInput)
              }
            />
            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={() => setOpen(true)}
            />
          </form>
        </div>

        {isOpen && (
          <div className={styles.userList}>
            <div className={styles.inputBlock}>
              <div className={styles.delimiterSpan}>-</div>
              <span
                className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                onClick={() => setOpen(false)}
              />
            </div>
            {trustedUsers.map((user, i) => (
              <div key={i} className={styles.itemUser}>
                <a
                  className={styles.userlink}
                  onClick={() => _openEtherscan(user.account)}
                >
                  {visible(user.account)}
                </a>
                <span
                  className={styles.deleteUsers}
                  onClick={() => removeTrustedUser(user.account)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {trustedUserInputError ? (
        <div className={styles.errorMessage}>{trustedUserInputError}</div>
      ) : null}
    </>
  )
}

// registry.dapplet-base.eth
// dev-1627024020035-70641704943070
// Ethereum
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
