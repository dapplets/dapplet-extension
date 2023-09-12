import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { ReactComponent as DropdownIcon } from '../assets/arrow.svg'

import styles from './Dropdown.module.scss'

export type DropdownProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const Dropdown: FC<DropdownProps> = (props: DropdownProps) => {
  const { ...anotherProps } = props
  const [isOpen, setOpen] = useState(false)
  const [mutationsEnable, setMutationsEnable] = useState(null)

  const [mutations, setMutations] = useState([])

  useEffect(() => {
    const init = async () => {
      await loadMutation()
    }
    init()
    return () => {}
  }, [])

  const loadMutation = async () => {
    const { getAllMutations, getMutation } = await initBGFunctions(browser)
    const mutations = await getAllMutations()
    const mutationsEnable = await getMutation()
    if (!mutationsEnable || !mutations) return
    console.log(mutationsEnable.split('/')[1], 'mutationsEnable')

    setMutationsEnable(
      mutations.filter((x) => x.id.split('/')[1] === mutationsEnable.split('/')[1])
    )
    setMutations(mutations)
  }

  const enableMutation = async (id: string, x: (x) => void) => {
    const { setMutation } = await initBGFunctions(browser)
    await setMutation(id)
    loadMutation()
    x(false)
  }

  const visible = (hash: string, length: number): string => {
    if (hash.length > length) {
      const firstCharacters = hash.substring(0, 15)
      const lastCharacters = hash.substring(hash.length - 0, hash.length - 10)

      return `${firstCharacters}...${lastCharacters}`
    } else {
      return hash
    }
  }
  const visibleDescription = (hash: string): string => {
    if (hash.length > 15) {
      const firstCharacters = hash.substring(0, 12)

      return `${firstCharacters}...`
    } else {
      return hash
    }
  }
  console.log(mutationsEnable)
  console.log(mutations)

  return (
    <div
      className={cn(styles.wrapper)}
      // onBlur={() => {
      //   setOpen(false)
      // }}
      // tabIndex={0}
    >
      {mutationsEnable && (
        <div className={cn(styles.inputBlock)}>
          <div className={cn(styles.topBlock)}>
            <div className={cn(styles.inputRegistries, styles.description)}>
              {visibleDescription(mutationsEnable[0].description)}
            </div>
            <span className={styles.descriptionOpasity}>&nbsp;by&nbsp;</span>
            <div className={cn(styles.inputRegistries, styles.author)}>
              {visibleDescription(mutationsEnable[0].id)}{' '}
            </div>
          </div>

          <span
            className={cn(styles.openList, { [styles.isOpen]: isOpen })}
            onClick={() => setOpen(!isOpen)}
          >
            <DropdownIcon />
          </span>
        </div>
      )}

      {isOpen && (
        <div className={styles.registriesList}>
          {mutations.length &&
            mutations.map((r, i) => (
              <div
                onClick={() => {
                  enableMutation(r.id, setOpen)
                }}
                key={i}
                className={cn(styles.inputBlock, styles.item, {
                  [styles.enable]: r.id === mutationsEnable[0].id,
                })}
              >
                <span className={cn(styles.inputRegistries, styles.description)}>
                  {visibleDescription(r.id.split('/')[1])}
                  <span className={styles.descriptionOpasity}>&nbsp;by&nbsp;</span>
                  <span className={cn(styles.inputRegistries, styles.author)}>
                    {visibleDescription(r.id.split('/')[0])}
                  </span>
                </span>
                <div className={cn(styles.inputRegistries, styles.descriptionOpasity)}>
                  {visible(r.description, 30)}
                </div>
                {/* {r.id === 'alsakhaev.testnet/test-mutation' ? (
                  <div className={styles.labelBlock}>Popular</div>
                ) : null} */}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
