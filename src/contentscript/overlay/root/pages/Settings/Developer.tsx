import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { groupBy } from '../../../../../common/helpers'
import { isValidUrl } from '../../../../../popup/helpers'
import { DevModule } from '../../components/DevModulesList'
import { Localhost } from '../../components/Localhost'
import { Registry } from '../../components/Registery'
import styles from './Developer.module.scss'

export interface DeveloperProps {
  setDappletsDetail: (x) => void
  setModuleInfo: any
  setModuleVersion: any
  setUnderConstruction: (x) => void
  setUnderConstructionDetails: (x) => void
  isShowChildrenRegistery: boolean
  setShowChildrenRegistery: (x) => void

  isLoadingDeploy: boolean
  setLoadingDeploy: () => void
  setLoadingDeployFinally: () => void
  setOpenWallet: () => void
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
  const _isMounted = useRef(true)

  const {
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    setUnderConstruction,
    setUnderConstructionDetails,
    isShowChildrenRegistery,
    setShowChildrenRegistery,
    isLoadingDeploy,
    setLoadingDeploy,
    setLoadingDeployFinally,
    setOpenWallet,
  } = props

  useEffect(() => {
    const init = async () => {
      setLoadButton(true)
      await loadRegistries()
      if (_isMounted.current) {
        const { getCurrentTab } = await initBGFunctions(browser)
        const currentTab = await getCurrentTab()
        if (!currentTab) return
        const currentUrl = currentTab.url
        const urlEnding = currentUrl.split('/').reverse()[0]
        if (['index.json', 'dapplet.json'].includes(urlEnding)) {
          setRegistryInput(currentUrl)
        }

        if (isUpdate) {
          await loadRegistries()
          setUpdate(false)
          setLoadButton(false)
        }
      }
      setLoadButton(false)
    }
    init()

    return () => {
      _isMounted.current = false
    }
  }, [isUpdate])

  const loadRegistries = async () => {
    const { getRegistries, getAllDevModules } = await initBGFunctions(browser)
    const modules: {
      module: ModuleInfo
      versions: VersionInfo[]
      isDeployed: boolean[]
    }[] = await getAllDevModules()
    setModules(modules)
    const registries = await getRegistries()
    setRegistries(registries.filter((r) => r.isDev === true))
  }

  const addRegistry = async (url: string, newFunction: () => void) => {
    setLoadAdd(true)
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setLoadButton(true)
      setRegistryInput('')

      loadRegistries()
    } catch (msg) {
      setRegistryInputError(msg.toString())

      setTimeout(() => setRegistryInputError(''), 3000)
    }

    newFunction()

    setLoadButton(false)

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
    setTimeout(() => setLoadButtonLocalhost(false), 1500)
  }

  const disableRegistry = async (url: string) => {
    setLoadButtonLocalhost(true)
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)
    loadRegistries()
    setTimeout(() => setLoadButtonLocalhost(false), 1500)
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
                    ;(!r.isEnabled && !r.error && enableRegistry(r.url)) ||
                      (r.isEnabled && r.error && disableRegistry(r.url)) ||
                      (r.isEnabled && !r.error && disableRegistry(r.url))
                  }}
                  children={
                    <div className={styles.modules}>
                      {modules.length > 0 &&
                        Object.entries(groupedModules).map(([registryUrl, modules]) => (
                          <div key={registryUrl + i}>
                            {modules.length > 0 && registryUrl === r.url && (
                              <DevModule
                                setOpenWallet={setOpenWallet}
                                isLoadingDeploy={isLoadingDeploy}
                                setLoadingDeploy={setLoadingDeploy}
                                setLoadingDeployFinally={setLoadingDeployFinally}
                                setUpdate={setUpdate}
                                isLocalhost={isLocalhost}
                                setDappletsDetail={setDappletsDetail}
                                modules={modules}
                                onDetailsClick={deployModule.bind(this)}
                                setModuleInfo={setModuleInfo}
                                setModuleVersion={setModuleVersion}
                                setUnderConstructionDetails={setUnderConstructionDetails}
                              />
                            )}
                          </div>
                        ))}
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
                            modules={modules}
                            onDetailsClick={deployModule.bind(this)}
                            setModuleInfo={setModuleInfo}
                            setModuleVersion={setModuleVersion}
                            setUnderConstructionDetails={setUnderConstructionDetails}
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
