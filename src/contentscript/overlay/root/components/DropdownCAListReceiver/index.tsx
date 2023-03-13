import React from 'react'
import { WalletDescriptorWithCAMainStatus } from '../../../../../common/types'
import { DropdownAccounts } from '../DropdownAccounts'

type TDropdownCAListReceiverProps = {
  values: WalletDescriptorWithCAMainStatus[]
  selected?: WalletDescriptorWithCAMainStatus
  setter: React.Dispatch<React.SetStateAction<WalletDescriptorWithCAMainStatus>>
}

export const DropdownCAListReceiver = (props: TDropdownCAListReceiverProps) => {
  const { values, selected, setter } = props

  return (
    <DropdownAccounts<WalletDescriptorWithCAMainStatus>
      values={values}
      selected={selected}
      setter={setter}
      nameId="account"
      originId="chain"
    />
  )
}
