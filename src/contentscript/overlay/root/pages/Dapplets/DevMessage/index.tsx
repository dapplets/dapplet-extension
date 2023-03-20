import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
// import en from 'javascript-time-ago/locale/en'
// import Linkify from 'react-linkify'
// import { SecureLink } from 'react-secure-link'
// import ReactTimeAgo from 'react-time-ago'
import { browser } from 'webextension-polyfill-ts'
// import TimeAgo from 'javascript-time-ago'
import cn from 'classnames'
import useAbortController from '../../../hooks/useAbortController'
import styles from './DevMesage.module.scss'

interface DevMessageProps {}
export const DevMessage: FC<DevMessageProps> = (props) => {
  const [newVersion, setNewExtensionVersion] = useState(null)
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      await _updateData()
    }
    init()
    return () => {
      abortController.abort()
    }
  }, [abortController.signal.aborted])
  const _updateData = async () => {
    const { getNewExtensionVersion, getIgnoredUpdate } = await initBGFunctions(browser)

    const ignoredUpdate = await getIgnoredUpdate()

    const newExtensionVersion = await getNewExtensionVersion()
    if (!abortController.signal.aborted) {
      setNewExtensionVersion(ignoredUpdate === newExtensionVersion ? null : newExtensionVersion)
    }
  }

  const _ignoreUpdate = async () => {
    const { setIgnoredUpdate } = await initBGFunctions(browser)
    setIgnoredUpdate(newVersion)
    setNewExtensionVersion(null)
  }
  const _showUpgradeGuide = async () => {
    window.open(
      `https://github.com/dapplets/dapplet-extension/releases/download/v${newVersion}/dapplet-extension.zip`
    )
  }
  const getNewExtensionVersion = () => {
    if (newVersion) {
      return (
        <div className={cn(styles.wrapper)}>
          <div className={styles.fisrtLine}>
            <div className={styles.versionBlock}>
              <span className={styles.newVersion}>Extension v.{newVersion} released</span>
              <span className={styles.version}>v. {EXTENSION_VERSION} installed</span>
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
            <a href="https://github.com/dapplets/dapplet-extension/releases/latest" target="_blank">
              Read changelist
            </a>
          </div>
        </div>
      )
    } else return null
  }

  return <>{getNewExtensionVersion ? getNewExtensionVersion() : null}</>
}
