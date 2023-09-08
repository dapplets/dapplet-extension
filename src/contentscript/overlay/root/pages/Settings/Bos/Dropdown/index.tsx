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
  const [selectedMutation, setSelectedMutation] = useState(null)

  const [mutations, setMutations] = useState([])

  useEffect(() => {
    const init = async () => {
      await loadMutation()
    }
    init()
  }, [])

  const loadMutation = async () => {
    const { getAllMutations, getMutation } = await initBGFunctions(browser)
    const mutations = await getAllMutations()
    const selectedMutationId = await getMutation()
    if (!selectedMutationId || !mutations) return

    setSelectedMutation(mutations.find((mut) => mut.id === selectedMutationId))
    setMutations(mutations)
  }

  const enableMutation = async (id: string, x: (x) => void) => {
    const { setMutation } = await initBGFunctions(browser)
    await setMutation(id)
    loadMutation()
    x(false)
  }

  const visibleDescription = (hash: string): string => {
    if (hash.length > 50) {
      const firstCharacters = hash.substring(0, 50)

      return `${firstCharacters}...`
    } else {
      return hash
    }
  }

  return (
    <div
      className={cn(styles.wrapper)}
      onBlur={() => {
        setOpen(false)
      }}
      tabIndex={0}
    >
      <div className={cn(styles.inputBlock)}>
        <div className={cn(styles.topBlock)}>
          {selectedMutation && (
            <>
              <div className={cn(styles.inputRegistries, styles.description)}>
                {visibleDescription(selectedMutation.description)}
              </div>
              <div className={cn(styles.inputRegistries, styles.author)}>{selectedMutation.id}</div>
            </>
          )}
        </div>
        <span
          className={cn(styles.openList, { [styles.isOpen]: isOpen })}
          onClick={() => setOpen(!isOpen)}
        >
          <DropdownIcon />
        </span>
      </div>

      {isOpen && (
        <div className={styles.registriesList}>
          <div className={styles.label}>Available mutations</div>

          {mutations.length &&
            mutations.map((r, i) => (
              <div
                onClick={() => {
                  enableMutation(r.id, setOpen)
                }}
                key={i}
                className={cn(styles.inputBlock, styles.item, {
                  [styles.enable]: r.id === selectedMutation?.id,
                })}
              >
                <span className={cn(styles.inputRegistries, styles.description)}>
                  {visibleDescription(r.description)}
                </span>
                <div className={cn(styles.inputRegistries, styles.author)}>
                  {visibleDescription(r.id)}
                </div>
                {r.id === 'dapplets.sputnik-dao.near/community' ? (
                  <div className={styles.labelBlock}>Popular</div>
                ) : null}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
