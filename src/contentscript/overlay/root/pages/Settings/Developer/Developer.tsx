import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../../background/models/versionInfo'
import { groupBy } from '../../../../../../common/helpers'
import { isValidUrl } from '../../../../../../popup/helpers'
import { DevModule } from '../../../components/DevModulesList'
import { Localhost } from '../../../components/Localhost'
import { Registry } from '../../../components/Registry'
import useAbortController from '../../../hooks/useAbortController'
import styles from './Developer.module.scss'

export interface DeveloperProps {
  setDappletsDetail: (x) => void
  setModuleInfo: any
  setModuleVersion: any
  setUnderConstruction: (x) => void
  setUnderConstructionDetails: (x) => void
  isShowChildrenRegistry: boolean
  setShowChildrenRegistry: (x) => void

  isLoadingDeploy: boolean
  setLoadingDeploy: () => void
  setLoadingDeployFinally: () => void
  setOpenWallet: () => void
  connectedDescriptors: []
  selectedWallet: string
}
export const Developer: FC<DeveloperProps> = (props: DeveloperProps) => {
  const [registries, setRegistries] = useState([])
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [modules, setModules] = useState([])
  const [isLoadButton, setLoadButton] = useState(false)
  const [isLocalhost, setLocalhost] = useState(true)
  const [isLoadButtonLocalhost, setLoadButtonLocalhost] = useState(false)
  const [isLoadAdd, setLoadAdd] = useState(false)
  const [isUpdate, setUpdate] = useState(false)
  const [currentAccount, setCurrentAccount] = useState(null)

  const {
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    setUnderConstruction,
    setUnderConstructionDetails,
    isShowChildrenRegistry,
    setShowChildrenRegistry,
    isLoadingDeploy,
    setLoadingDeploy,
    setLoadingDeployFinally,
    setOpenWallet,
    connectedDescriptors,
    selectedWallet,
  } = props
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      setLoadButton(true)
      await loadRegistries()
      const { getCurrentTab } = await initBGFunctions(browser)
      const currentTab = await getCurrentTab()
      if (!currentTab) return
      const currentUrl = currentTab.url
      const urlEnding = currentUrl.split('/').reverse()[0]
      if (['index.json', 'dapplet.json'].includes(urlEnding)) {
        setRegistryInput(currentUrl)
        if (isUpdate) {
          await loadRegistries()
          if (!abortController.signal.aborted) {
            setUpdate(false)
          }
        }
      }
      if (!abortController.signal.aborted) {
        setLoadButton(false)
      }
    }
    init()
    return () => {
      // abortController.abort()
    }
  }, [isUpdate, selectedWallet, abortController.signal.aborted])

  const loadRegistries = async () => {
    const { getRegistries, getAllDevModules } = await initBGFunctions(browser)
    const modules: {
      module: ModuleInfo
      versions: VersionInfo[]
      isDeployed: boolean[]
    }[] = await getAllDevModules()
    if (!abortController.signal.aborted) {
      setModules(modules)
    }

    const registries = await getRegistries()
    if (!abortController.signal.aborted) {
      setRegistries(registries.filter((r) => r.isDev === true))
    }
  }

  const addRegistry = async (url: string, newFunction: () => void) => {
    setLoadAdd(true)
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setRegistryInput('')

      loadRegistries()
    } catch (msg) {
      setRegistryInputError(msg.toString())

      setTimeout(() => setRegistryInputError(''), 3000)
    }

    newFunction()
    setTimeout(() => setLoadAdd(false), 3000)
  }

  const removeRegistry = async (url: string) => {
    setLoadAdd(true)
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
    setTimeout(() => setLoadAdd(false), 3000)
  }

  const deployModule = async (mi: ModuleInfo, vi: VersionInfo) => {
    // const { openDeployOverlay } = await initBGFunctions(browser)
    // await openDeployOverlay(mi, vi)
    // window.close()
  }
  const enableRegistry = async (url: string) => {
    setLoadButtonLocalhost(true)
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    loadRegistries()
    setTimeout(() => {
      if (!abortController.signal.aborted) {
        setLoadButtonLocalhost(false)
      }
    }, 1500)
  }

  const disableRegistry = async (url: string) => {
    setLoadButtonLocalhost(true)
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)
    loadRegistries()
    setTimeout(() => {
      if (!abortController.signal.aborted) {
        setLoadButtonLocalhost(false)
      }
    }, 1500)
  }

  const groupedModules = groupBy(modules, (x) => x.module.registryUrl)

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
              data-testid={`input-add-localhost`}
              value={registryInput}
              onChange={(e) => {
                setRegistryInput(e.target.value)
                setRegistryInputError(null)
              }}
              placeholder="Manifest URL"
              disabled={
                !isValidUrl(registryInput) && !!registries.find((r) => r.url === registryInput)
              }
            />
            {isLoadAdd ? (
              <div className={styles.loadAdd}></div>
            ) : (
              <button
                data-testid={`button-add-localhost`}
                disabled={
                  isLoadButton ||
                  !(isValidUrl(registryInput) && !registries.find((r) => r.url === registryInput))
                }
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
          {isLoadButton ? (
            <div className={styles.miniLoader}></div>
          ) : (
            <>
              {registries.map((r, i) => (
                <div key={i}>
                  <Localhost
                    error={r.error}
                    isEnabled={r.isEnabled}
                    label={r.url}
                    key={i}
                    closeHost={() => removeRegistry(r.url)}
                    isLoadButtonLocalhost={isLoadButtonLocalhost}
                    onClickButtonLocalhost={() => {
                      ;(!r.isEnabled && !r.error && enableRegistry(r.url)) ||
                        (r.isEnabled && r.error && disableRegistry(r.url)) ||
                        (r.isEnabled && !r.error && disableRegistry(r.url))
                    }}
                    children={
                      <div className={styles.modules}>
                        {modules.length > 0 &&
                          Object.entries(groupedModules).map(([registryUrl, modules]) => {
                            return (
                              modules.length > 0 &&
                              registryUrl === r.url &&
                              modules.map((x, i) => (
                                <div key={registryUrl + i}>
                                  <DevModule
                                    currentAccount={currentAccount}
                                    setCurrentAccount={setCurrentAccount}
                                    selectedWallet={selectedWallet}
                                    connectedDescriptors={connectedDescriptors}
                                    setOpenWallet={setOpenWallet}
                                    isLoadingDeploy={isLoadingDeploy}
                                    setLoadingDeploy={setLoadingDeploy}
                                    setLoadingDeployFinally={setLoadingDeployFinally}
                                    setUpdate={setUpdate}
                                    isLocalhost={isLocalhost}
                                    setDappletsDetail={setDappletsDetail}
                                    modules={x}
                                    onDetailsClick={deployModule.bind(this)}
                                    setModuleInfo={setModuleInfo}
                                    setModuleVersion={setModuleVersion}
                                    setUnderConstructionDetails={setUnderConstructionDetails}
                                  />
                                </div>
                              ))
                            )
                          })}
                      </div>
                    }
                  />
                </div>
              ))}

              <div className={styles.host}>
                {modules.length > 0 &&
                  Object.entries(groupedModules).map(([registryUrl, modules]) => (
                    <div key={registryUrl}>
                      {modules.length > 0 && modules[0].module.author !== null && (
                        <Registry
                          key={registryUrl}
                          label={registryUrl}
                          isShowChildrenRegistry={isShowChildrenRegistry}
                          setShowChildrenRegistry={setShowChildrenRegistry}
                          children={modules.map((x, i) => (
                            <div key={i} className={styles.modules}>
                              <DevModule
                                currentAccount={currentAccount}
                                setCurrentAccount={setCurrentAccount}
                                setDappletsDetail={setDappletsDetail}
                                modules={x}
                                onDetailsClick={deployModule.bind(this)}
                                setModuleInfo={setModuleInfo}
                                setModuleVersion={setModuleVersion}
                                setUnderConstructionDetails={setUnderConstructionDetails}
                              />
                            </div>
                          ))}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
      {/* <div className={styles.createUnderConstraction}>
        <button
          className={styles.btnCreate}
          onClick={() => {
            setUnderConstruction(true)
            setDappletsDetail(false)
            setUnderConstructionDetails(false)
          }}
        >
          Create «under construction» dapplet
        </button>
      </div> */}
    </div>
  )
}
