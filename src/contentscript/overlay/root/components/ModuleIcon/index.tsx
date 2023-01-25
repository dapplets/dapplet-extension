import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageRef } from '../../../../../common/types'
import { StorageRefImage } from '../../components/StorageRefImage'

export interface ModuleIconProps {
  moduleName: string
  registryUrl: string
  className?: string
  onClick?: (x) => void
}

export const ModuleIcon: React.FC<ModuleIconProps> = (props) => {
  const { moduleName, registryUrl, className, onClick } = props

  const [storageRef, setStorageRef] = useState<StorageRef>(null)

  useEffect(() => {
    let isSubscribed = true

    const fetchData = async () => {
      const { getModuleInfoByName } = await initBGFunctions(browser)
      const mi = await getModuleInfoByName(registryUrl, moduleName)

      if (isSubscribed) {
        setStorageRef(mi?.icon)
      }
    }

    fetchData().catch(console.error)

    return () => {
      isSubscribed = false
    }
  }, [])

  return <StorageRefImage storageRef={storageRef} className={className} onClick={onClick} />
}
