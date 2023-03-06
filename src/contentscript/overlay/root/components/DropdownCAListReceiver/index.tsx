import cn from 'classnames'
import React, { useState } from 'react'
import { resources } from '../../../../../common/resources'
import { WalletDescriptor } from '../../../../../common/types'
import { ReactComponent as DropdownIcon } from '../../assets/icons/arrow-01.svg'
import { CAUserButton } from '../CAUserButton'
import styles from './DropdownCAListReceiver.module.scss'

type TDropdownCAListReceiverProps = {
  values: WalletDescriptor[]
  selected?: WalletDescriptor
  setter: React.Dispatch<React.SetStateAction<WalletDescriptor>>
}

export const DropdownCAListReceiver = (props: TDropdownCAListReceiverProps) => {
  const { values, selected, setter } = props
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
                img: resources[selected.chain].icon,
                name: selected.account,
                origin: selected.chain,
                accountActive: false,
              }
            }
            maxLength={20}
            colour="#eaf0f0"
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
              .filter((v) => !(v.account === selected.account && v.chain === selected.chain))
              .map((value) => (
                <div
                  className={styles.item}
                  key={value.account}
                  onClick={() => {
                    setter(value)
                    setOpen(!isOpen)
                  }}
                >
                  <CAUserButton
                    user={{
                      img: resources[value.chain].icon,
                      name: value.account,
                      origin: value.chain,
                      accountActive: false,
                    }}
                    maxLength={20}
                    colour="#eaf0f0"
                  />
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
