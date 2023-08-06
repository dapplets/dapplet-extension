import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, memo, useCallback, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import ModuleInfo from '../../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../../background/models/versionInfo'
import * as EventBus from '../../../../../../common/global-event-bus'
import { groupBy, isValidUrl, makeCancelable } from '../../../../../../common/helpers'
import { DevModule } from '../../../components/DevModulesList'
import { Localhost } from '../../../components/Localhost'
import { Registry } from '../../../components/Registry'
import styles from './Developer.module.scss'

export interface DeveloperProps {
  setDappletsDetail: (x) => void
  setModuleInfo: any
  setModuleVersion: any
  setUnderConstruction: (x) => void
  setUnderConstructionDetails: (x) => void
  isShowChildrenRegistry: boolean
  setShowChildrenRegistry: (x) => void
  setOpenWallet: () => void
  connectedDescriptors: []
  selectedWallet: string
  initModules: () => void
}

export const Developer: FC<DeveloperProps> = memo(function Developer(props: DeveloperProps) {
  const {
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    setUnderConstruction,
    setUnderConstructionDetails,
    isShowChildrenRegistry,
    setShowChildrenRegistry,
    setOpenWallet,
    connectedDescriptors,
    selectedWallet,
    initModules,
  } = props

  const isLocalhost = true
  const [registries, setRegistries] = useState([])
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [modules, _setModules] = useState([])
  const [isLoadButton, setLoadButton] = useState(false)
  const [isLoadButtonLocalhost, setLoadButtonLocalhost] = useState(false)
  const [isLoadAdd, setLoadAdd] = useState(false)
  const [isUpdate, setUpdate] = useState(false)
  const [currentAccount, _setCurrentAccount] = useState(null)

  const memorizedSetCurrentAccount = useCallback(
    (newCurrentAccount) => _setCurrentAccount(newCurrentAccount),
    []
  )

  const memorizedSetModules = useCallback((newModules) => _setModules(newModules), [])

  const memorizedLoadRegistries = useCallback(async () => {
    const { getRegistries, getAllDevModules } = await initBGFunctions(browser)
    const modules: {
      module: ModuleInfo
      versions: VersionInfo[]
      isDeployed: boolean[]
    }[] = await getAllDevModules()

    memorizedSetModules(modules)

    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === true))
  }, [memorizedSetModules])

  const memorizedUpdateData = useCallback(async () => {
    setLoadButton(true)
    await memorizedLoadRegistries()
    const { getCurrentTab } = await initBGFunctions(browser)
    const currentTab = await getCurrentTab()
    if (!currentTab) return
    const currentUrl = currentTab.url
    const urlEnding = currentUrl.split('/').reverse()[0]
    if (['index.json', 'dapplet.json'].includes(urlEnding)) {
      setRegistryInput(currentUrl)
      if (isUpdate) {
        await memorizedLoadRegistries()

        setUpdate(false)
      }
    }

    setLoadButton(false)
  }, [isUpdate, memorizedLoadRegistries])

  useEffect(() => {
    const cancelebleFn = makeCancelable(new Promise(() => memorizedUpdateData()))
    cancelebleFn.promise.catch((reason) => console.warn('Cancelable Promise rejected:', reason))
    return () => cancelebleFn.cancel()
  }, [memorizedUpdateData])

  useEffect(() => {
    let cancelebleFn: any
    EventBus.on('wallet_changed', () => {
      cancelebleFn = makeCancelable(new Promise(() => memorizedUpdateData()))
      cancelebleFn.promise.catch((reason) => console.warn('Cancelable Promise rejected:', reason))
    })
    return () => {
      EventBus.off('wallet_changed', memorizedUpdateData)
      cancelebleFn?.cancel()
    }
  }, [memorizedUpdateData])

  const addRegistry = async (url: string, newFunction: () => void) => {
    setLoadAdd(true)
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setRegistryInput('')

      memorizedLoadRegistries()
    } catch (msg) {
      setRegistryInputError(msg.toString())

      setTimeout(() => setRegistryInputError(''), 3000)
    }

    newFunction()
    initModules()
    setTimeout(() => setLoadAdd(false), 3000)
  }

  const removeRegistry = async (url: string) => {
    setLoadAdd(true)
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    memorizedLoadRegistries()
    initModules()
    setTimeout(() => setLoadAdd(false), 3000)
  }

  const enableRegistry = async (url: string) => {
    setLoadButtonLocalhost(true)
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    memorizedLoadRegistries()
    initModules()
    setTimeout(() => {
      setLoadButtonLocalhost(false)
    }, 1500)
  }

  const disableRegistry = async (url: string) => {
    setLoadButtonLocalhost(true)
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)
    memorizedLoadRegistries()
    initModules()
    setTimeout(() => {
      setLoadButtonLocalhost(false)
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
              data-testid="input-add-localhost"
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
                data-testid="button-add-localhost"
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
                  >
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
                                  setCurrentAccount={memorizedSetCurrentAccount}
                                  selectedWallet={selectedWallet}
                                  connectedDescriptors={connectedDescriptors}
                                  setOpenWallet={setOpenWallet}
                                  setUpdate={setUpdate}
                                  isLocalhost={isLocalhost}
                                  setDappletsDetail={setDappletsDetail}
                                  modules={x}
                                  setModuleInfo={setModuleInfo}
                                  setModuleVersion={setModuleVersion}
                                  setUnderConstructionDetails={setUnderConstructionDetails}
                                />
                              </div>
                            ))
                          )
                        })}
                    </div>
                  </Localhost>
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
                        >
                          {modules.map((x, i) => (
                            <div key={i} className={styles.modules}>
                              <DevModule
                                currentAccount={currentAccount}
                                setCurrentAccount={memorizedSetCurrentAccount}
                                setDappletsDetail={setDappletsDetail}
                                modules={x}
                                setModuleInfo={setModuleInfo}
                                setModuleVersion={setModuleVersion}
                                setUnderConstructionDetails={setUnderConstructionDetails}
                              />
                            </div>
                          ))}
                        </Registry>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}
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
          Create «under construction» dapplet
        </button>
      </div>
    </div>
  )
})
