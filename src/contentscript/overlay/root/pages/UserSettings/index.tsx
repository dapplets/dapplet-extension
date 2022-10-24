import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { DappletImage } from '../../components/DappletImage'
import { DappletTitle } from '../../components/DappletTitle'
import { SquaredButton } from '../../components/SquaredButton'
import { SettingsPage } from './SettingsPage'
import styles from './UserSettings.module.scss'
import { ReactComponent as Home } from '../../assets/svg/newHome.svg'
import { Overlay } from '../../overlay'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
export interface UserSettingsProps {
  dappletName: string
  registryUrl: string
  module?: any
 
}

export const UserSettings = ({ dappletName, registryUrl,module }: UserSettingsProps): ReactElement => {
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
console.log(mi,'mi');
console.log(vi,'vi');


const onOpenDappletAction = async (f: ManifestAndDetails) => {
  try {
  
    const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
    const tab = await getCurrentTab()

    if (!tab) return
    await openDappletAction(f.name, tab.id)
  } catch (err) {
    console.error(err)
  } 
}

const modules = module.filter((x) => x.name === mi.name)

console.log(modules);

  return (<div className={styles.userSettingsWrapper}>
  
        <div className={cn(styles.wrapperCard)}>
          <div className={cn(styles.leftBlock)}>
            <DappletImage isFavourites={false} storageRef={mi.icon} className={styles.imgBlock} />

            <DappletTitle
              className={styles.title}
              isShowDescription={false}
              title={mi.title}
            ></DappletTitle>
          </div>
         { modules[0].isActionHandler ? <div className={styles.blockButtons}>
            <SquaredButton
              appearance="smail"
              icon={Home}
              className={styles.squareButton}
              title="Home"
              onClick={() => onOpenDappletAction(mi)}
            />
          </div>: null}
          
        </div>
   
    <SettingsPage
      isLoad={isLoad}
      setLoad={setLoad}
      mi={mi}
      vi={vi}
      schemaConfig={schemaConfig}
      defaultConfig={defaultConfig}
    /></div>
  )
}
