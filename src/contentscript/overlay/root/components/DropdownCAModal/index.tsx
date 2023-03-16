import React from 'react'
import { IConnectedAccountUser } from '../../../../../common/types'
import { DropdownAccounts } from '../DropdownAccounts'

type TDropdownCAModalProps = {
  values: IConnectedAccountUser[]
  selected?: IConnectedAccountUser
  setter: React.Dispatch<React.SetStateAction<IConnectedAccountUser>>
}

export const DropdownCAModal = (props: TDropdownCAModalProps) => {
  const { values, selected, setter } = props

  return (
    <DropdownAccounts<IConnectedAccountUser>
      values={values}
      selected={selected}
      setter={setter}
      nameId="name"
      originId="origin"
    />
  )
}
