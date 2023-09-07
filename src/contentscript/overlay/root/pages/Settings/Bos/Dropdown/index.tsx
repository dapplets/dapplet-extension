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
  const [mutationsInput, setMutationsInput] = useState('')

  const [mutations, setMutations] = useState([])

  useEffect(() => {
    const init = async () => {
      await loadMutation()
    }
    init()
    return () => {}
  }, [])

  const loadMutation = async () => {
    const { getAllMutations } = await initBGFunctions(browser)
    const mutations = await getAllMutations()

    setMutations(mutations)
  }

  //   const enableMutation = async (url: string, x: (x) => void) => {
  //     const { enableMutation } = await initBGFunctions(browser)
  //     await enableMutation(url)
  //     loadMutation()
  //     x(false)
  //   }

  const visible = (hash: string, length: number): string => {
    if (hash.length > length) {
      const firstCharacters = hash.substring(0, 6)
      const lastCharacters = hash.substring(hash.length - 0, hash.length - 5)

      return `${firstCharacters}...${lastCharacters}`
    } else {
      return hash
    }
  }

  return (
    <div
      className={cn(styles.wrapper)}
      // onBlur={() => {
      //   setOpen(false)
      // }}
      // tabIndex={0}
    >
      {mutations.map((r, i) => (
        <div key={i} className={cn(styles.inputBlock)}>
          <div className={cn(styles.topBlock)}>
            <div className={cn(styles.inputRegistries, styles.description)}>{r.description}</div>
            <div className={cn(styles.inputRegistries, styles.author)}>
              Vestibulum by{' '}
              <span className={cn(styles.authorAddress)}>{visible(r.authorId, 15)}</span>{' '}
            </div>
          </div>

          <span
            className={cn(styles.openList, { [styles.isOpen]: isOpen })}
            onClick={() => setOpen(!isOpen)}
          >
            <DropdownIcon />
          </span>
        </div>
      ))}

      {isOpen && (
        <div className={styles.registriesList}>
          <div className={styles.label}>Available mutations</div>

          {mutations.map((r, i) => (
            <div key={i} className={cn(styles.inputBlock,styles.item)}>
              <span
                className={cn(styles.inputRegistries, styles.description)}
                onClick={() => {
                  // enableMutation(r.authorId, setOpen)
                }}
              >
                {r.description}
              </span>
              <div className={cn(styles.inputRegistries, styles.author)}>
              Vestibulum by{' '}
              <span className={cn(styles.authorAddress)}>{visible(r.authorId, 15)}</span>{' '}
            </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
