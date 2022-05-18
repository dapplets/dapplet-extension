import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import cn from 'classnames'
import styles from './UserSettings.module.scss'
import { DefaultConfig, SchemaConfig } from '../../../../../common/types'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD } from '../../../../../common/constants'
import { Message } from '../../components/Message'
import { SettingWrapper } from '../../components/SettingWrapper'
import { StorageRefImage } from '../../components/DevModulesList'
import { Bus } from '../../../../../common/bus'
import * as tracing from '../../../../../common/tracing'
import { SettingItem } from '../../components/SettingItem'

tracing.startTracing()

export interface UserSettingsProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  userSettings: any
}
let _isMounted = false
export const UserSettings = (props: UserSettingsProps): ReactElement => {
  const { userSettings } = props
  const bus = new Bus()
  const [mi, setMi] = useState<
    ModuleInfo & {
      hostnames: string[]
      order: number
      sourceRegistry: { url: string; isDev: boolean }
    }
  >(userSettings)
  const [vi, setVi] = useState<VersionInfo>()
  const [schemaConfig, setSchemaConfig] = useState<SchemaConfig>(null)
  const [defaultConfig, setDefaultConfig] = useState<DefaultConfig>(null)
  const [owner, setOwner] = useState(null)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [hiddenProperties, setHiddenProperties] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [isEdited, setIsEdited] = useState(false)

  useEffect(() => {
    const init = async () => {
      // bus.subscribe('data', async ({ mi, vi, schemaConfig, defaultConfig }) => {
      //   const { getDevMode, getSwarmGateway } = await initBGFunctions(browser)
      //   const devMode = await getDevMode()
      //   const swarmGatewayUrl = await getSwarmGateway()

      //   const hiddenProperties =
      //     schemaConfig && schemaConfig.properties
      //       ? Object.entries(schemaConfig.properties)
      //           .filter(([k, v]: any) => v.hidden)
      //           .map(([k, v]: any) => v.title ?? k)
      //       : []

      //   // Do not show hidden settings when developer mode is disabled
      //   if (!devMode) {
      //     if (schemaConfig && schemaConfig.properties) {
      //       for (const key in schemaConfig.properties) {
      //         if (schemaConfig.properties[key].hidden) {
      //           delete schemaConfig.properties[key]
      //         }
      //       }
      //     }
      //   }
      //   setMi(mi)
      //   setVi(vi)
      //   setSchemaConfig(schemaConfig)
      //   setDefaultConfig(defaultConfig)
      //   setDevMode(devMode)
      //   setHiddenProperties(hiddenProperties)
      //   setSwarmGatewayUrl(swarmGatewayUrl)

      //   await _refreshData()
      //   await _updateOwnership()
      // })
      await _refreshData()
      await _updateOwnership()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [])
  console.log(mi)

  const _refreshData = async () => {
    const { getAllUserSettings } = await initBGFunctions(browser)
    const defaultData = (defaultConfig && defaultConfig[vi.environment]) || {}
    const customData = await getAllUserSettings(mi.name)
    const data = { ...defaultData, ...customData }
    setData({ data })
  }

  const _updateOwnership = async () => {
    if (!mi.sourceRegistry.isDev) {
      const { getOwnership } = await initBGFunctions(browser)
      const owner = await getOwnership(mi.sourceRegistry.url, mi.name)
      setOwner({ owner })
    }
  }

  const _saveData = async (data: any) => {
    setLoading(true)
    setData({ data })

    const { setAllUserSettings } = await initBGFunctions(browser)
    await setAllUserSettings(mi.name, data)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setIsEdited(false)
  }

  const _reloadFeature = async () => {
    const { reloadFeature } = await initBGFunctions(browser)
    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : mi.hostnames
    await reloadFeature(
      mi.name,
      vi.version,
      targetContextIds,
      mi.order,
      mi.sourceRegistry.url
    )
  }

  const _resetSettings = async () => {
    setLoading(true)
    const { clearUserSettings } = await initBGFunctions(browser)
    await clearUserSettings(mi.name)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setIsEdited(false)
  }
  return (
    <div className={styles.wrapper}>
      {/* <h1 className={styles.title}>User Settings</h1> */}
      {mi || vi ? (
        <div>
          {/* Warning about Hidden properties */}
          {devMode && hiddenProperties.length > 0 ? (
            <Message
              title={'Hidden settings'}
              children={
                <>
                  <p>
                    The following options are available only in developer mode:
                  </p>
                  <p>{hiddenProperties.join(', ')}</p>
                </>
              }
            />
          ) : null}

          {/* Module Header Info */}

          <div className={styles.blockInfo}>
            {/* <Image
                floated="right"
                size="mini"
                circular
                src={
                  mi.icon && mi.icon.uris.length > 0
                    ? mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1
                      ? joinUrls(
                          this.state.swarmGatewayUrl,
                          'bzz/' +
                            mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]
                        )
                      : mi.icon.uris?.[0]
                    : NOLOGO_PNG
                }
              /> */}
            <SettingWrapper
              className={styles.wrapperSettings}
              title="User Settings"
              children={
                <div className={styles.socialBlock}>
                  <div className={styles.moduleTitle}> {mi.title}</div>

                  <div className={styles.moduleTitle}> {mi.type}</div>
                  <div className={styles.moduleTitle}> {mi.description}</div>
                </div>
              }
            />

            <SettingWrapper
              className={styles.wrapperSettings}
              title="Owner"
              children={
                <div className={styles.socialBlock}>
                  <a
                    onClick={() =>
                      window.open(
                        `https://goerli.etherscan.io/address/${owner}`,
                        '_blank'
                      )
                    }
                    className={styles.moduleTitle}
                  ></a>
                </div>
              }
            />
            {/* Form */}
            {/* {
            schemaConfig && schemaConfig.properties ? ( */}
            <SettingWrapper
              title="Config"
              children={
                <div className={styles.ownershipBlock}>
                  <SettingItem
                    title=""
                    component={<></>}
                    className={styles.item}
                    children={
                      <div className={styles.inputOwnershipBlock}>
                        <input
                          //  value={}
                          className={cn(styles.inputOwnership, {
                            //  [styles.inputOwnershipInvalid]: isDisabledAddOwner,
                          })}
                          //  placeholder={mi.author || 'New owner adress'}
                          //  onChange={(e) => {
                          //    setNewOwner(e.target.value)
                          //    setDisabledAddOwner(false)
                          //  }}
                        />

                        <button
                          onClick={() => {
                            //  _transferOwnership(newOwner)
                          }}
                          className={styles.ownershipButton}
                        >
                          Save
                        </button>
                        <button
                          //  onClick={() => onDeleteChild(i)}
                          className={styles.authorDelete}
                        />
                      </div>
                    }
                  />
                </div>
              }
            />
            {/* ) : null
            // <p>No settings available for this dapplet.</p>
          } */}
          </div>
        </div>
      ) : // <Dimmer active inverted>
      //   <Loader inverted>Loading</Loader>
      // </Dimmer>
      null}
    </div>
  )
}
