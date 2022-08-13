import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { typeOfUri, UriTypes } from '../../../../../common/helpers'
import { isValidUrl } from '../../../../../popup/helpers'
import {
  regExpIndexENS,
  regExpIndexEthereum,
  regExpIndexNear,
  regExpIndexNEARDev,
  regExpIndexNEARImplicit,
  regExpIndexNearTestnet,
} from '../../common/constans'
import { getValidationAddress } from '../../common/helpers'
import { IDropdown } from '../../models/dropdown.model'
import styles from './DropdownTrustedUsers.module.scss'

export interface DropdownTrustedProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  list?: IDropdown[]
  value?: IDropdown | null
}
let _isMounted = false
export const DropdownTrustedUsers: FC<DropdownTrustedProps> = (props: DropdownTrustedProps) => {
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

  const addTrustedUser = async (account: string, addedFunction: () => void) => {
    const { addTrustedUser } = await initBGFunctions(browser)
    const valueParse = getValidationAddress(trustedUserInput, regExpIndexEthereum)
    const valueParseNEARImplicit = getValidationAddress(trustedUserInput, regExpIndexNEARImplicit)
    const valueParseNEARDev = getValidationAddress(trustedUserInput, regExpIndexNEARDev)
    const valueParseENS = getValidationAddress(trustedUserInput, regExpIndexENS)
    const valueParseNear = getValidationAddress(trustedUserInput, regExpIndexNear)
    const valueParseNearTestnet = getValidationAddress(trustedUserInput, regExpIndexNearTestnet)
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
      addedFunction()
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
      window.open(`https://explorer.testnet.near.org/accounts/${address}`, '_blank')
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
      const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 18)

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

              addTrustedUser(trustedUserInput, handleClear)
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
              <div className={styles.delimiterSpan}>{'\u2013'}</div>
              <span
                className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                onClick={() => setOpen(false)}
              />
            </div>
            {trustedUsers.map((user, i) => (
              <div key={i} className={styles.itemUser}>
                <a className={styles.userlink} onClick={() => _openEtherscan(user.account)}>
                  {visible(user.account)}
                </a>
                <span className={styles.deleteUsersContainer}>
                  <span
                    className={styles.deleteUsers}
                    onClick={() => removeTrustedUser(user.account)}
                  />
                </span>
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
