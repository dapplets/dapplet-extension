import React, { useState, useEffect, useMemo, FC } from 'react'
import cn from 'classnames'
import styles from './Developer.module.scss'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { checkUrlAvailability, groupBy } from '../../../../../common/helpers'

import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'

import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { Localhost } from '../../components/Localhost'
import { UnderConstruction } from '../../components/UnderConstruction'
import { DevModule } from '../../components/DevModulesList'
import { Registry } from '../../components/Registery'
import TopologicalSort from 'topological-sort'
import { DevModulesList } from '../../../../../popup/components/DevModulesList'
let _isMounted = true
export interface DeveloperProps {
  isDappletsDetails: any
  setDappletsDetail: (x) => void
  setModuleInfo: any
  setModuleVersion: any
  isUnderConstruction: boolean
  setUnderConstruction: (x) => void
  isUnderConstructionDetails: boolean
  setUnderConstructionDetails: (x) => void
  isShowChildrenUnderConstraction: boolean
  setShowChildrenUnderConstraction: (x) => void
  isShowChildrenRegistery: boolean
  setShowChildrenRegistery: (x) => void
}
export const Developer: FC<DeveloperProps> = (props: DeveloperProps) => {
  const [isLoading, onLoading] = useState(true)
  const [registries, setRegistries] = useState([])
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [intro, setIntro] = useState({ popupDeveloperWelcome: false })
  const [modules, setModules] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [dataUri, setDataUri] = useState(null)
  const [isLoadButton, setLoadButton] = useState(false)
  const [isLocalhost, setLocalhost] = useState(true)
  const [isLoadButtonLocalhost, setLoadButtonLocalhost] = useState(false)
  const [isLoadAdd, setLoadAdd] = useState(false)

  const {
    isDappletsDetails,
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    isUnderConstruction,
    setUnderConstruction,
    isUnderConstructionDetails,
    setUnderConstructionDetails,
    isShowChildrenUnderConstraction,
    setShowChildrenUnderConstraction,
    isShowChildrenRegistery,
    setShowChildrenRegistery,
  } = props

  useEffect(() => {
    _isMounted = true

    const init = async () => {
      setLoadButton(true)
      await loadSwarmGateway()
      await loadRegistries()
      await loadIntro()

      const { getCurrentTab } = await initBGFunctions(browser)
      const currentTab = await getCurrentTab()
      if (!currentTab) return
      const currentUrl = currentTab.url
      const urlEnding = currentUrl.split('/').reverse()[0]
      if (['index.json', 'dapplet.json'].includes(urlEnding)) {
        setRegistryInput(currentUrl)
      }
      setLoadButton(false)
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [])

  const loadSwarmGateway = async () => {
    const { getSwarmGateway } = await initBGFunctions(browser)
    const swarmGatewayUrl = await getSwarmGateway()
    setSwarmGatewayUrl(swarmGatewayUrl)
  }
  const loadRegistries = async () => {
    // setLoadButton(true)
    const { getRegistries, getAllDevModules } = await initBGFunctions(browser)

    const modules: {
      module: ModuleInfo
      versions: VersionInfo[]
      isDeployed: boolean[]
    }[] = await getAllDevModules()
    setModules(modules)

    const registries = await getRegistries()
    // onLoading(false)
    setRegistries(registries.filter((r) => r.isDev === true))
    // setLoadButton(false)
  }

  const loadIntro = async () => {
    // setLoadButton(true)
    const { getIntro } = await initBGFunctions(browser)
    const intro = await getIntro()
    setIntro(intro)
    // setLoadButton(false)
  }

  const closeWelcomeIntro = async () => {
    const { setIntro } = await initBGFunctions(browser)
    setIntro({ popupDeveloperWelcome: false })
    await setIntro({ popupDeveloperWelcome: false })
  }

  const addRegistry = async (url: string, x: () => void) => {
    setLoadAdd(true)
    setLoadButton(true)
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setRegistryInput('')
    } catch (msg) {
      setRegistryInputError(msg.toString())
    }

    loadRegistries()
    x()
    setLoadButton(false)
    setTimeout(() => setLoadAdd(false), 1500)
  }

  const removeRegistry = async (url: string) => {
    setLoadAdd(true)
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
    setTimeout(() => setLoadAdd(false), 1500)
  }

  const deployModule = async (mi: ModuleInfo, vi: VersionInfo) => {
    // const { openDeployOverlay } = await initBGFunctions(browser)
    // await openDeployOverlay(mi, vi)
    // window.close()
  }
  const enableRegistry = async (url: string) => {
    // onLoading(true)

    setLoadButtonLocalhost(true)
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)

    loadRegistries()
    setTimeout(() => setLoadButtonLocalhost(false), 1500)
  }

  const disableRegistry = async (url: string) => {
    // onLoading(true)

    setLoadButtonLocalhost(true)
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)

    loadRegistries()
    setTimeout(() => setLoadButtonLocalhost(false), 1500)
  }

  // const onCreateModuleHandler = async () => {
  //   const { openDeployOverlay } = await initBGFunctions(browser)
  //   await openDeployOverlay(null, null)
  //   // window.close()
  // }
  const groupedModules = groupBy(modules, (x) => x.module.registryUrl)
  // const groupedModules2 = groupBy(modules, (x) => x.module.isUnderConstruction)

  const handleClear = () => {
    setRegistryInput('')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.blockModules}>
        <div className={styles.inputHost}>
          <div
            className={cn(styles.form, {})}
            onBlur={() => {
              setRegistryInputError(null)
            }}
            tabIndex={0}
          >
            <input
              className={cn(styles.input, {
                [styles.errorInput]: !!registryInputError,
              })}
              value={registryInput}
              onChange={(e) => {
                setRegistryInput(e.target.value)
                setRegistryInputError(null)
              }}
              placeholder="Manifest URL"
              disabled={
                !isValidUrl(registryInput) &&
                !!registries.find((r) => r.url === registryInput)
              }
            />
            {isLoadAdd ? (
              <div className={styles.loadAdd}></div>
            ) : (
              <button
                disabled={isLoadButton}
                className={cn(styles.buttonInput, {
                  [styles.buttonInputDisabled]: isLoadButton,
                })}
                onClick={() => addRegistry(registryInput, handleClear)}
              >
                add
              </button>
            )}
          </div>
          {registryInputError ? (
            <div className={styles.errorMessage}>{registryInputError}</div>
          ) : null}
        </div>
        <div className={styles.host}>
          {isLoadButton && !isLoadButtonLocalhost ? (
            <div className={styles.miniLoader}></div>
          ) : (
            registries.map((r, i) => (
              <div key={i}>
                <Localhost
                  error={r.error}
                  isEnabled={r.isEnabled}
                  label={r.url}
                  key={i}
                  closeHost={() => removeRegistry(r.url)}
                  isLoadButtonLocalhost={isLoadButtonLocalhost}
                  onClickButtonLocalhost={() => {
                    setLoadButtonLocalhost(true)
                    // console.log(isLoadButton)
                    // console.log(isLoadButtonLocalhost)
                    ;(!r.isEnabled && !r.error && enableRegistry(r.url)) ||
                      (r.isEnabled && r.error && disableRegistry(r.url)) ||
                      (r.isEnabled && !r.error && disableRegistry(r.url))
                  }}
                  children={
                    <div className={styles.modules}>
                      {modules.length > 0 &&
                        Object.entries(groupedModules).map(
                          ([registryUrl, modules]) => (
                            <div key={registryUrl + i}>
                              {modules.length > 0 && registryUrl === r.url && (
                                <DevModule
                                  isLocalhost={isLocalhost}
                                  isDappletsDetails={isDappletsDetails}
                                  setDappletsDetail={setDappletsDetail}
                                  modules={modules}
                                  onDetailsClick={deployModule.bind(this)}
                                  setModuleInfo={setModuleInfo}
                                  setModuleVersion={setModuleVersion}
                                  isUnderConstructionDetails={
                                    isUnderConstructionDetails
                                  }
                                  setUnderConstructionDetails={
                                    setUnderConstructionDetails
                                  }
                                />
                              )}
                            </div>
                          )
                        )}
                    </div>
                  }
                />
              </div>
            ))
          )}

          <div className={styles.host}>
            {modules.length > 0 &&
              Object.entries(groupedModules).map(([registryUrl, modules]) => (
                <div key={registryUrl}>
                  {modules.length > 0 && modules[0].module.author !== null && (
                    <Registry
                      key={registryUrl}
                      label={registryUrl}
                      isShowChildrenRegistery={isShowChildrenRegistery}
                      setShowChildrenRegistery={setShowChildrenRegistery}
                      children={
                        <div className={styles.modules}>
                          <DevModule
                            setDappletsDetail={setDappletsDetail}
                            isDappletsDetails={isDappletsDetails}
                            modules={modules}
                            onDetailsClick={deployModule.bind(this)}
                            setModuleInfo={setModuleInfo}
                            setModuleVersion={setModuleVersion}
                            isUnderConstructionDetails={isShowChildrenRegistery}
                            // setUnderConstructionDetails={
                            //   setShowChildrenRegistery
                            // }
                            // isUnderConstructionDetails={
                            //   isUnderConstructionDetails
                            // }
                            setUnderConstructionDetails={
                              setUnderConstructionDetails
                            }
                          />
                        </div>
                      }
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className={styles.createUnderConstraction}>
        <button
          className={styles.btnCreate}
          onClick={() => {
            setUnderConstruction(true)
            setDappletsDetail(false)
            setUnderConstructionDetails(false)
          }}
        >
          Create under construction dapplet
        </button>
      </div>
    </div>
  )
}
