import React from 'react'
import { NearNetworks } from '../../../../../common/types'
import { DropdownSettings } from '../DropdownSettings'

export const DropdownPreferredCANetwork = () => (
  <DropdownSettings
    values={NearNetworks}
    getterName="getPreferredConnectedAccountsNetwork"
    setterName="setPreferredConnectedAccountsNetwork"
    event="connected_accounts_changed"
  />
)
