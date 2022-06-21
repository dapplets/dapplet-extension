import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { ReactElement, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { DefaultConfig, SchemaConfig } from '../../../../../common/types'
import { SettingsPage } from './SettingsPage'
// import { SettingsPage } from '../../../../../settings/SettingsPage'

type UserSettingsContext = {
  mi: ModuleInfo & {
    hostnames: string[]
    order: number
    sourceRegistry: { url: string; isDev: boolean }
  }
  vi: VersionInfo
  schemaConfig: SchemaConfig
  defaultConfig: DefaultConfig
}

export interface UserSettingsProps {
  dappletName: string
  registryUrl: string
}
let _isMounted = false
export const UserSettings = ({ dappletName, registryUrl }: UserSettingsProps): ReactElement => {
  const [settingsContext, setSettingsContext] = useState(null)
  const [isLoad, setLoad] = useState(false)
  useEffect(() => {
    _isMounted = true

    const init = async () => {
      setLoad(true)
      setSettingsContext(null)
      const { getUserSettingsForOverlay } = await initBGFunctions(browser)

      const { mi, vi, schemaConfig, defaultConfig } = await getUserSettingsForOverlay(
        registryUrl,
        dappletName
      )

      setSettingsContext({ mi, vi, schemaConfig, defaultConfig })
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [dappletName, registryUrl])

  if (!settingsContext) return null
  const { mi, vi, schemaConfig, defaultConfig } = settingsContext

  return (
    <SettingsPage
      isLoad={isLoad}
      setLoad={setLoad}
      mi={mi}
      vi={vi}
      schemaConfig={schemaConfig}
      defaultConfig={defaultConfig}
    />
  )
}
