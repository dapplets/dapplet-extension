import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { ManifestAndDetails } from '../../../../../common/types'
import { ReactComponent as Home } from '../../assets/svg/home.svg'
import { DappletImage } from '../../components/DappletImage'
import { DappletTitle } from '../../components/DappletTitle'
import { SquaredButton } from '../../components/SquaredButton'
import { SettingsPage } from './SettingsPage'
import styles from './UserSettings.module.scss'

export interface UserSettingsProps {
  dappletName: string
  registryUrl: string
  modules?: any
  overlays?: any
  navigation?: any
}

export const UserSettings = ({
  dappletName,
  registryUrl,
  modules,
  overlays,
  navigation,
}: UserSettingsProps): ReactElement => {
  const [settingsContext, setSettingsContext] = useState(null)
  const [isLoad, setLoad] = useState(false)
  useEffect(() => {
    const init = async () => {
      setLoad(true)
      setSettingsContext(null)
      const { getUserSettingsForOverlay, getRegistries } = await initBGFunctions(browser)
      const registries = await getRegistries()
      const prodRegistries = registries.filter((r) => !r.isDev && r.isEnabled)

      const { mi, vi, schemaConfig, defaultConfig } = await getUserSettingsForOverlay(
        registryUrl ? registryUrl : prodRegistries[0]?.url,
        dappletName
      )

      setSettingsContext({ mi, vi, schemaConfig, defaultConfig })
    }
    init()

    return () => {}
  }, [dappletName, registryUrl])

  if (!settingsContext) return null
  const { mi, vi, schemaConfig, defaultConfig } = settingsContext

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    overlays.filter((x) => x.source === f.name).map((x) => navigation!(`/${f.name}/${x.id}`))
  }

  const hasActionHandler = modules.find((x) => x.name === mi.name)?.isActionHandler

  return (
    <div className={styles.userSettingsWrapper}>
      <div className={cn(styles.wrapperCard)}>
        <div className={cn(styles.leftBlock)}>
          <DappletImage storageRef={mi.icon} className={styles.imgBlock} />

          <DappletTitle
            className={styles.title}
            isShowDescription={false}
            title={mi.title}
          ></DappletTitle>
        </div>
        {hasActionHandler && (
          <div className={styles.blockButtons}>
            <SquaredButton
              appearance="smail"
              icon={Home}
              className={styles.squareButton}
              title="Home"
              onClick={() => onOpenDappletAction(mi)}
            />
          </div>
        )}
      </div>

      <SettingsPage
        isLoad={isLoad}
        setLoad={setLoad}
        mi={mi}
        vi={vi}
        schemaConfig={schemaConfig}
        defaultConfig={defaultConfig}
      />
    </div>
  )
}
