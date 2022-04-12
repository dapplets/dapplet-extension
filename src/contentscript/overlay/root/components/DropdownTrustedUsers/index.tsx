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
  const [isOpen, setOpen] = useToggle(false)
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
  }, [])
  const addTrustedUser = async (account: string) => {
    const { addTrustedUser } = await initBGFunctions(browser)

    try {
      await addTrustedUser(account)
      setTrustedUserInput(trustedUserInput)
    } catch (err) {
      setTrustedUserInputError(err.message)
    }

    loadTrustedUsers()
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
  return (
    <div className={styles.wrapper}>
      <div className={styles.inputTrustedUsers}>
        <div className={styles.inputBlock}>
          <input
            className={cn(styles.inputUsers, {
              [styles.errorInput]: trustedUserInputError,
            })}
            placeholder="NEAR or Ethereum address..."
            value={trustedUserInput}
            onClick={() => addTrustedUser(trustedUserInput)}
            onChange={(e) => {
              setTrustedUserInput(e.target.value)
              setTrustedUserInputError(null)
            }}
            disabled={
              // !(
              !isValidUrl(trustedUserInput) &&
              !!registries.find((r) => r.url === trustedUserInput)
              // )
            }
            // error={!!trustedUserInputError}
          />
          <span
            className={cn(styles.openList, { [styles.isOpen]: isOpen })}
            onClick={setOpen}
          />
        </div>
        {trustedUserInputError ? (
          <div className={styles.errorMessage}>{trustedUserInputError}</div>
        ) : null}
      </div>
      {/* {trustedUserInputError ? <span>{trustedUserInputError}</span> : null} */}
      {isOpen && (
        <div className={styles.userList}>
          <div className={styles.inputBlock}>
            <div className={styles.delimiterSpan}>-</div>
            <span
              className={cn(styles.openList, { [styles.isOpen]: isOpen })}
              onClick={setOpen}
            />
          </div>
          {trustedUsers.map((user, i) => (
            <div key={i} className={styles.itemUser}>
              <a
                className={styles.userlink}
                onClick={() => _openEtherscan(user.account)}
              >
                {user.account}
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
  )
}

// registry.dapplet-base.eth
// dev-1627024020035-70641704943070
