import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
// import en from 'javascript-time-ago/locale/en'
// import Linkify from 'react-linkify'
// import { SecureLink } from 'react-secure-link'
// import ReactTimeAgo from 'react-time-ago'
import { browser } from 'webextension-polyfill-ts'
// import TimeAgo from 'javascript-time-ago'
import cn from 'classnames'
import styles from './DevMesage.module.scss'

interface DevMessageProps {}
export const DevMessage: FC<DevMessageProps> = (props) => {
  const [devMessage, setDevMessage] = useState(null)
  const [newExtensionVersion, setNewExtensionVersion] = useState(null)
  const [discordMessages, setDiscordMessages] = useState([])

  useEffect(() => {
    const init = async () => {
      _updateData()
    }
    init()
    return () => {}
  }, [])
  const _updateData = async () => {
    const { getDevMessage, getNewExtensionVersion, getIgnoredUpdate, getDiscordMessages } =
      await initBGFunctions(browser)
    const devMessage = await getDevMessage()
    const ignoredUpdate = await getIgnoredUpdate()
    // const ignoredUpdate = '0.50.1'
    const newExtensionVersion = await getNewExtensionVersion()
    const discordMessages = await getDiscordMessages()

    setDevMessage(devMessage)

    setNewExtensionVersion(ignoredUpdate === newExtensionVersion ? null : newExtensionVersion)
    setDiscordMessages(discordMessages)
  }

  const _hideDevMessage = async () => {
    const { hideDevMessage } = await initBGFunctions(browser)
    await hideDevMessage(devMessage)
    setDevMessage(null)
  }

  const _hideDiscordMessages = async () => {
    const { hideDiscordMessages } = await initBGFunctions(browser)
    await hideDiscordMessages(discordMessages[0].timestamp)
    setDiscordMessages([])
  }

  const _ignoreUpdate = async () => {
    const { setIgnoredUpdate } = await initBGFunctions(browser)
    setIgnoredUpdate(newExtensionVersion)
    setNewExtensionVersion(null)
  }
  const _showUpgradeGuide = async () => {
    window.open(
      `https://github.com/dapplets/dapplet-extension/releases/download/v${newExtensionVersion}/dapplet-extension.zip`
    )
  }
  const getNewExtensionVersion = () => {
    if (newExtensionVersion) {
      return (
        <div className={cn(styles.wrapper)}>
          <div className={styles.fisrtLine}>
            <div className={styles.versionBlock}>
              <span className={styles.newVersion}>Extension v. {newExtensionVersion} released</span>
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
