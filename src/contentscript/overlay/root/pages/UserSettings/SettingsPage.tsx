import { withTheme } from '@rjsf/core'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD } from '../../../../../common/constants'
import { DefaultConfig, SchemaConfig } from '../../../../../common/types'
import { Message } from '../../components/Message'
import SelectWidget from './SelectWiget/SelectWigets'
import './settingPage.css'
import TextWidget from './TextWiget/TextWigets'
import styles from './UserSettings.module.scss'

export interface SettingsPageProps {
  mi?: ModuleInfo & {
    hostnames: string[]
    order: number
    sourceRegistry: { url: string; isDev: boolean }
  }
  vi?: VersionInfo
  schemaConfig?: SchemaConfig
  defaultConfig?: DefaultConfig
}
let _isMounted = false

const theme = { widgets: { SelectWidget, TextWidget } }
const Form = withTheme(theme)

export const SettingsPage: FC<SettingsPageProps> = (props) => {
  const { mi, vi, schemaConfig, defaultConfig } = props

  const [owner, setOwner] = useState(null)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [hiddenProperties, setHiddenProperties] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [isEdited, setEdited] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      if (mi || vi || schemaConfig || defaultConfig) {
        const { getDevMode, getSwarmGateway } = await initBGFunctions(browser)
        const devMode = await getDevMode()
        const swarmGatewayUrl = await getSwarmGateway()

        const hiddenProperties =
          schemaConfig && schemaConfig.properties
            ? Object.entries(schemaConfig.properties)
                .filter(([k, v]: any) => v.hidden)
                .map(([k, v]: any) => v.title ?? k)
            : []

        // Do not show hidden settings when developer mode is disabled
        if (!devMode) {
          if (schemaConfig && schemaConfig.properties) {
            for (const key in schemaConfig.properties) {
              if (schemaConfig.properties[key].hidden) {
                delete schemaConfig.properties[key]
              }
            }
          }
        }
        setDevMode(devMode)
        setHiddenProperties(hiddenProperties)
        setSwarmGatewayUrl(swarmGatewayUrl)

        await _refreshData()
        await _updateOwnership()
      }
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [])

  const _refreshData = async () => {
    const { getAllUserSettings } = await initBGFunctions(browser)
    const customData = await getAllUserSettings(mi.name)
    const defaultData = (defaultConfig && defaultConfig[vi.environment]) || {}
    const data = { ...defaultData, ...customData }
    setData(data)
  }

  const _updateOwnership = async () => {
    if (!mi.sourceRegistry.isDev) {
      const { getOwnership } = await initBGFunctions(browser)
      const owner = await getOwnership(mi.sourceRegistry.url, mi.name)
      setOwner(owner)
    }
  }
  const _saveData = async (data: any) => {
    setLoading(true)
    setData(data)

    const { setAllUserSettings } = await initBGFunctions(browser)
    await setAllUserSettings(mi.name, data)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setEdited(false)
  }

  const _reloadFeature = async () => {
    const { reloadFeature } = await initBGFunctions(browser)
    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : mi.hostnames
    await reloadFeature(mi.name, vi.version, targetContextIds, mi.order, mi.sourceRegistry.url)
  }

  const _resetSettings = async () => {
    setLoading(true)

    const { clearUserSettings } = await initBGFunctions(browser)
    await clearUserSettings(mi.name)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setEdited(false)
  }
  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 6)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  return (
    <div className={styles.wrapper}>
      {mi && vi ? (
        <div className={styles.block}>
          <div className={styles.wrapperInfoCard}>
            <h3 className={styles.cardTitle}>{mi.title}</h3>
            <h3 className={styles.cardType}>{mi.type}</h3>
            <div className={styles.cardDescription}>{mi.description}</div>
            <div className={styles.cardName}>{mi.name}</div>
            <div className={styles.blockInfo}>
              <div className={styles.cardOwner}>
                version:
                <span className={styles.cardVersion}>{vi.version}</span>
              </div>
              {owner ? (
                <div className={styles.cardOwner}>
                  Owner:
                  <a
                    className={styles.cardLink}
                    onClick={() =>
                      window.open(`https://goerli.etherscan.io/address/${owner}`, '_blank')
                    }
                  >
                    {visible(owner)}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          {devMode && hiddenProperties.length > 0 ? (
            <Message
              className={styles.messageUserSettings}
              title="Hidden settings"
              subtitle="The following options are available only in developer mode:"
              children={<>{hiddenProperties.join(', ')}</>}
            />
          ) : null}

          {schemaConfig && schemaConfig.properties ? (
            <Form
              className={styles.form}
              schema={schemaConfig || {}}
              onSubmit={(e) => _saveData(e.formData)}
              formData={data}
              onChange={(e) => {
                setEdited(true)
                setData(e.formData)
              }}
            >
              <div className={styles.wrapperButton}>
                <button
                  className={styles.buttonSubmit}
                  type="submit"
                  disabled={loading || !isEdited}
                >
                  Save and Reload
                </button>
                <button
                  className={styles.buttonSubmit}
                  disabled={loading}
                  onClick={() => _resetSettings()}
                >
                  Reset
                </button>
              </div>
            </Form>
          ) : (
            <Message
              className={styles.messageUserSettings}
              title="No settings available for this dapplet."
            />
          )}
        </div>
      ) : (
        <div className={styles.blockLoading}>Loading</div>
      )}
    </div>
  )
}
