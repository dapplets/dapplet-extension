import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
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
  module?: any
  overlays?: any
  navigation?: any
}

export const UserSettings = ({
  dappletName,
  registryUrl,
  module,
  overlays,
  navigation,
}: UserSettingsProps): ReactElement => {
  const [settingsContext, setSettingsContext] = useState(null)
  const [isLoad, setLoad] = useState(false)
  useEffect(() => {
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

    return () => {}
  }, [dappletName, registryUrl])

  if (!settingsContext) return null
  const { mi, vi, schemaConfig, defaultConfig } = settingsContext

  const onOpenDappletAction = async (f: ManifestAndDetails) => {
    overlays.filter((x) => x.source === f.name).map((x) => navigation!(`/${f.name}/${x.id}`))
  }

  const modules = module.filter((x) => x.name === mi.name)

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
        {modules.length > 0 && modules[0] && modules[0].isActionHandler ? (
          <div className={styles.blockButtons}>
            <SquaredButton
              appearance="smail"
              icon={Home}
              className={styles.squareButton}
              title="Home"
              onClick={() => onOpenDappletAction(mi)}
            />
          </div>
        ) : null}
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
