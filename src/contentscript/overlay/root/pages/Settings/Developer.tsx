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
let _isMounted = true

export const Developer = () => {
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
      // await loadRegistries()
      await loadIntro()
      // await Promise.all([loadRegistries(), loadIntro()])
      const { getCurrentTab } = await initBGFunctions(browser)
      const currentTab = await getCurrentTab()
      if (!currentTab) return
      const currentUrl = currentTab.url
      const urlEnding = currentUrl.split('/').reverse()[0]
      if (['index.json', 'dapplet.json'].includes(urlEnding)) {
        setRegistryInput(currentUrl)
      }

      // const { getResource } = await initBGFunctions(browser)
      // const base64 = await getResource(storageRef)
      // const dataUri = 'data:text/plain;base64,' + base64
      // setDataUri(dataUri)
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

  const addRegistry = async (url: string) => {
    const { addRegistry } = await initBGFunctions(browser)

    try {
      await addRegistry(url, true)
      setRegistryInput('')
    } catch (msg) {
      setRegistryInputError(msg.toString())
    }

    loadRegistries()
  }

  const removeRegistry = async (url: string) => {
    const { removeRegistry } = await initBGFunctions(browser)
    await removeRegistry(url)
    loadRegistries()
  }

  const deployModule = async (mi: ModuleInfo, vi: VersionInfo) => {
    const { openDeployOverlay } = await initBGFunctions(browser)
    await openDeployOverlay(mi, vi)
    // window.close()
  }
  const enableRegistry = async (url: string) => {
    const { enableRegistry } = await initBGFunctions(browser)
    await enableRegistry(url)
    loadRegistries()
  }

  const disableRegistry = async (url: string) => {
    const { disableRegistry } = await initBGFunctions(browser)
    await disableRegistry(url)
    loadRegistries()
  }

  const onCreateModuleHandler = async () => {
    const { openDeployOverlay } = await initBGFunctions(browser)
    await openDeployOverlay(null, null)
    // window.close()
  }
  const groupedModules = groupBy(modules, (x) => x.module.registryUrl)

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputHost}>
        <InputPanel
          value={registryInput}
          onChange={(e) => {
            setRegistryInput(e.target.value)
            setRegistryInputError(null)
          }}
          onClick={() => addRegistry(registryInput)}
          placeholder="Manifest URL"
        />
      </div>
      <div className={styles.host}>
        {registries.map((r, i) => (
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
                {modules.length > 0 ? (
                  Object.entries(groupedModules).map(
                    ([registryUrl, modules]) => (
                      <div key={registryUrl}>
                        {modules.length > 0 ? (
                          <DevModule
                            modules={modules}
                            onDetailsClick={deployModule}
                          />
                        ) : (
                          <div>No available development modules.</div>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div>No available development modules.</div>
                )}
              </div>
            }
          />
        ))}
        {/* <div style={{ flex: 'auto' }}>
         
        </div> */}
      </div>

      <div className={styles.createUnderConstraction}>
        <button className={styles.btnCreate} onClick={onCreateModuleHandler}>
          Create under construction dapplet
        </button>
      </div>
    </div>
  )
}
