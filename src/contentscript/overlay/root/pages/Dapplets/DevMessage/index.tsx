import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useState } from 'react'
import { useQuery } from 'react-query'
import browser from 'webextension-polyfill'
import styles from './DevMesage.module.scss'

export const useNewVersion = (newVersion: string, setNewVersion) => {
  return useQuery({
    queryKey: ['newversion', newVersion],
    queryFn: () => setNewVersion(),
  })
}

export const DevMessage: FC = () => {
  const [newVersion, setNewExtensionVersion] = useState(null)
  const _updateData = async () => {
    const { getNewExtensionVersion, getIgnoredUpdate } = await initBGFunctions(browser)

    const ignoredUpdate = await getIgnoredUpdate()

    const newExtensionVersion = await getNewExtensionVersion()
    if (ignoredUpdate === newExtensionVersion) {
      return null
    } else {
      return newExtensionVersion
    }
  }
  const { data } = useNewVersion(newVersion, _updateData)

  const _ignoreUpdate = async () => {
    const { setIgnoredUpdate } = await initBGFunctions(browser)
    setIgnoredUpdate(data)
    setNewExtensionVersion(null)
  }
  const _showUpgradeGuide = async () => {
    window.open(
      `https://github.com/dapplets/dapplet-extension/releases/download/v${data}/dapplet-extension.zip`
    )
  }
  const getNewExtensionVersion = () => {
    if (data) {
      return (
        <div className={cn(styles.wrapper)}>
          <div className={styles.fisrtLine}>
            <div className={styles.versionBlock}>
              <span className={styles.newVersion}>Extension v{data} released</span>
              <span className={styles.version}>v{EXTENSION_VERSION} installed</span>
            </div>
            <div className={styles.buttonBlock}>
              <button className={styles.buttonIgnore} onClick={_ignoreUpdate}>
                Ignore
              </button>
              <button className={styles.buttonUpgrade} onClick={_showUpgradeGuide}>
                Update
              </button>
            </div>
          </div>
          <div className={styles.secondLine}>
            <a
              href="https://github.com/dapplets/dapplet-extension/releases/latest"
              target="_blank"
              rel="noreferrer"
            >
              Read changelist
            </a>
          </div>
        </div>
      )
    } else return null
  }

  return <>{getNewExtensionVersion ? getNewExtensionVersion() : null}</>
}
