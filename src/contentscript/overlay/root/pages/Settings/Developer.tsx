import React, { useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import styles from './Developer.module.scss'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { checkUrlAvailability, groupBy } from '../../../../../common/helpers'
import { StorageRef } from '../../../../../background/registries/registry'
import { InputPanel } from '../../components/InputPanel'
// import { CheckboxList } from '../Notifications'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'

import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { Localhost } from '../../components/Localhost'

import { DevModule } from '../../components/DevModulesList'
import { Registry } from '../../components/Registery'
import TopologicalSort from 'topological-sort'
let _isMounted = true

export const Developer = ({ isDappletsDetails, setDappletsDetail }) => {
  const [isLoading, onLoading] = useState(true)
  const [registries, setRegistries] = useState([])
  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [intro, setIntro] = useState({ popupDeveloperWelcome: false })
  const [modules, setModules] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [dataUri, setDataUri] = useState(null)
  // const [storageRef] = <StorageRef>

  useEffect(() => {
    _isMounted = true
    // loadSwarmGateway()

    const init = async () => {
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
    const { getRegistries, getAllDevModules } = await initBGFunctions(browser)

    const modules: {
      module: ModuleInfo
      versions: VersionInfo[]
      isDeployed: boolean[]
    }[] = await getAllDevModules()
    setModules(modules)

    const registries = await getRegistries()
    onLoading(false)
    setRegistries(registries.filter((r) => r.isDev === true))
  }

  const loadIntro = async () => {
    const { getIntro } = await initBGFunctions(browser)
    const intro = await getIntro()
    setIntro(intro)
  }

  const closeWelcomeIntro = async () => {
    const { setIntro } = await initBGFunctions(browser)
    setIntro({ popupDeveloperWelcome: false })
    await setIntro({ popupDeveloperWelcome: false })
  }

  const addRegistry = async (url: string, x: () => void) => {
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setRegistryInput('')
    } catch (msg) {
      setRegistryInputError(msg.toString())
    }

    loadRegistries()
    x()
  }

  const removeRegistry = async (url: string) => {
    onLoading(true)
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
  }

  const deployModule = async (mi: ModuleInfo, vi: VersionInfo) => {
    const { openDeployOverlay } = await initBGFunctions(browser)
    await openDeployOverlay(mi, vi)
    window.close()
  }
  const enableRegistry = async (url: string) => {
    onLoading(true)
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    loadRegistries()
  }

  const disableRegistry = async (url: string) => {
    onLoading(true)
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)
    loadRegistries()
  }

  const onCreateModuleHandler = async () => {
    const { openDeployOverlay } = await initBGFunctions(browser)
    await openDeployOverlay(null, null)
    window.close()
  }
  const groupedModules = groupBy(modules, (x) => x.module.registryUrl)

  // console.log(modules)
  // console.log(registries)
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
              //  error={!!registryInputError}
              // buttonDefault

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
            <button
              className={styles.buttonInput}
              onClick={() => addRegistry(registryInput, handleClear)}
            >
              add
            </button>
          </div>
          {registryInputError ? (
            <div className={styles.errorMessage}>{registryInputError}</div>
          ) : null}
          {/* <InputPanel
          error={!!registryInputError}
          buttonDefault
          value={registryInput}
          onChange={(e) => {
            setRegistryInput(e.target.value)
            setRegistryInputError(null)
          }}
          onClick={() => addRegistry(registryInput)}
          placeholder="Manifest URL"
          disabled={
            !isValidUrl(registryInput) &&
            !!registries.find((r) => r.url === registryInput)
          }
        /> */}
        </div>
        <div className={styles.host}>
          {registries.map((r, i) => (
            <div key={i}>
              <Localhost
                error={r.error}
                isEnabled={r.isEnabled}
                label={r.url}
                key={i}
                closeHost={() => removeRegistry(r.url)}
                onClickButtonLocalhost={() => {
                  ;(!r.isEnabled && !r.error && enableRegistry(r.url)) ||
                    (r.isEnabled && r.error && disableRegistry(r.url)) ||
                    (r.isEnabled && !r.error && disableRegistry(r.url))
                  // console.log(r.error, r.isEnabled)
                  // console.log(r)
                }}
                children={
                  <div className={styles.modules}>
                    {
                      modules.length > 0 &&
                        Object.entries(groupedModules).map(
                          ([registryUrl, modules]) => (
                            <div key={registryUrl}>
                              {/* && registryUrl === r.url */}
                              {/* {modules.length > 0  ? (
                          <DevModule
                            modules={modules}
                            onDetailsClick={() => deployModule}
                          />
                        ) : (
                          <div>No available development modules.</div>
                        )} */}
                              {modules.length > 0 && registryUrl === r.url && (
                                <DevModule
                                  isDappletsDetails={isDappletsDetails}
                                  setDappletsDetail={setDappletsDetail}
                                  modules={modules}
                                  onDetailsClick={deployModule.bind(this)}
                                />
                              )}
                            </div>
                          )
                        )
                      // : (
                      //   <div>No available development modules.</div>
                      // )
                    }
                  </div>
                }
              />
            </div>
          ))}
          <div className={styles.host}>
            {
              modules.length > 0 &&
                Object.entries(groupedModules).map(([registryUrl, modules]) => (
                  // {modules.author}

                  <div
                    key={registryUrl}
                    // onClick={() => console.log(modules[0].author)}
                  >
                    {/* && registryUrl === r.url */}
                    {/* {modules.length > 0  ? (
                          <DevModule
                            modules={modules}
                            onDetailsClick={() => deployModule}
                          />
                        ) : (
                          <div>No available development modules.</div>
                        )} */}
                    {modules.length > 0 && modules[0].module.author !== null && (
                      <Registry
                        key={registryUrl}
                        label={registryUrl}
                        children={
                          <div
                            className={styles.modules}
                            onClick={() =>
                              console.log(modules[0].module.author)
                            }
                          >
                            <DevModule
                              setDappletsDetail={setDappletsDetail}
                              isDappletsDetails={isDappletsDetails}
                              modules={modules}
                              onDetailsClick={deployModule.bind(this)}
                            />
                          </div>
                        }
                      />
                    )}
                  </div>
                ))
              // : (
              //   <div key={i}>No available development modules.</div>
              // )
            }
          </div>
        </div>
      </div>
      <div className={styles.createUnderConstraction}>
        <button className={styles.btnCreate} onClick={onCreateModuleHandler}>
          Create under construction dapplet
        </button>
      </div>
    </div>
  )
}
