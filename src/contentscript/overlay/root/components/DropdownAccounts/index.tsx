import cn from 'classnames'
import React, { useState } from 'react'
import { resources } from '../../../../../common/resources'
import { ReactComponent as DropdownIcon } from '../../assets/icons/arrow-01.svg'
import { CAUserButton } from '../CAUserButton'
import styles from './DropdownAccounts.module.scss'

type TDropdownAccountsProps<T> = {
  values: T[]
  selected?: T
  setter: React.Dispatch<React.SetStateAction<T>>
  nameId: string
  originId: string
  maxLength?: number
}

export function DropdownAccounts<T>(props: TDropdownAccountsProps<T>) {
  const { values, selected, setter, nameId, originId, maxLength = 20 } = props
  const [isOpen, setOpen] = useState(false)

  return (
    <div
      className={styles.wrapper}
      onClick={() => values && values.length > 1 && setOpen(!isOpen)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          className={cn(styles.dropdownLabel, {
            [styles.isOpen]: isOpen,
            [styles.clickable]: values && values.length > 1,
          })}
        >
          <CAUserButton
            user={
              selected && {
                img: resources[selected[originId]].icon,
                name: selected[nameId],
                origin: selected[originId],
                accountActive: selected['accountActive'],
              }
            }
            maxLength={maxLength}
            color="#eaf0f0"
          />
        </div>
        {values && values.length > 1 && (
          <span className={cn(styles.openList, { [styles.isOpen]: isOpen })}>
            <DropdownIcon />
          </span>
        )}
      </div>
      {isOpen && (
        <div className={styles.itemsContainer}>
          {values.length &&
            values
              .filter(
                (v) => !(v[nameId] === selected?.[nameId] && v[originId] === selected?.[originId])
              )
              .map((value) => (
                <div
                  className={styles.item}
                  key={value[nameId]}
                  onClick={() => {
                    setter(value)
                    setOpen(!isOpen)
                  }}
                >
                  <CAUserButton
                    user={{
                      img: resources[value[originId]].icon,
                      name: value[nameId],
                      origin: value[originId],
                      accountActive: value['accountActive'],
                    }}
                    maxLength={maxLength}
                    color="#eaf0f0"
                  />
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
