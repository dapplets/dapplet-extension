import React from 'react'
import { OverlayStorages } from '../../../../../common/types'
import { DropdownSettings } from '../DropdownSettings'

export const DropdownPreferedOverlayStorage = () => (
  <DropdownSettings
    values={OverlayStorages}
    getterName="getPreferedOverlayStorage"
    setterName="setPreferedOverlayStorage"
  />
)
