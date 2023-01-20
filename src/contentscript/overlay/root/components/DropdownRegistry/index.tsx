import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { isValidUrl } from '../../../../../common/helpers'
import useAbortController from '../../hooks/useAbortController'
import { addSettingsValueDropdown } from '../../utils/addSettingsValueDropdown'

import styles from './DropdownRegistry.module.scss'

export type DropdownRegistryProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

export const DropdownRegistry: FC<DropdownRegistryProps> = (props: DropdownRegistryProps) => {
  const { ...anotherProps } = props
  const [isOpen, setOpen] = useState(false)
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [registries, setRegistries] = useState([])
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      await loadRegistries()
    }
    init()
    return () => {
      // abortController.abort()
    }
  }, [abortController.signal.aborted])

  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()
    if (!abortController.signal.aborted) {
      setRegistries(registries.filter((r) => r.isDev === false))
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
      const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 18)

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

                    addSettingsValueDropdown(
                      registryInput,
                      'registry',
                      registryInput,
                      setRegistryInputError,
                      setRegistryInput,
                      loadRegistries,
                      handleClear
                    )
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
              <div className={styles.delimiterSpan}>{'\u2013'}</div>
              <span
                className={cn(styles.openList, { [styles.isOpen]: isOpen })}
                onClick={() => setOpen(false)}
              />
            </div>

            {registries.map((r, i) => (
              <div
                key={i}
                className={cn(styles.itemRegistries, {
                  [styles.activeLink]: r.isEnabled,
                })}
              >
                <span
                  className={cn(styles.registrieslink, {})}
                  onClick={() => {
                    enableRegistry(r.url, setOpen)
                  }}
                >
                  {visible(r.url)}
                </span>
                {!r.isEnabled && (
                  <span className={styles.deleteUsersContainer}>
                    <span
                      onClick={() => removeRegistry(r.url)}
                      className={styles.deleteRegistryes}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {registryInputError ? <div className={styles.errorMessage}>{registryInputError}</div> : null}
    </>
  )
}
