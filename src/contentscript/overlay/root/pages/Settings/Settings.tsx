import React, { ReactElement, useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import styles from './Settings.module.scss'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'

import { SettingTitle } from '../../components/SettingTitle'
import { SettingItem } from '../../components/SettingItem'
import { Switch } from '../../components/Switch'
import { Dropdown } from '../../components/Dropdown'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Checkbox } from '../../components/Checkbox'
import { InputPanel } from '../../components/InputPanel'
import { DropdownSettings } from '../../components/DropdownSettings'

export const DROPDOWN_LIST = [{ _id: '0', label: 'Custom' }]
let _isMounted = false

export const SettingsList = () => {
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)

  const [providerInput, setProviderInput] = useState('')
  const [providerEdited, setProviderEdited] = useState(false)
  const [providerInputError, setProviderInputError] = useState(null)

  const [swarmGatewayInput, setSwarmGatewayInput] = useState('')
  const [swarmGatewayInputError, setSwarmGatewayInputError] = useState(null)
  const [swarmGatewayEdited, setSwarmGatewayEdited] = useState(false)

  const [swarmPostageStampIdInput, setSwarmPostageStampIdInput] = useState('')
  const [swarmPostageStampIdInputError, setSwarmPostageStampIdInputError] =
    useState(null)
  const [swarmPostageStampIdInputEdited, setSwarmPostageStampIdInputEdited] =
    useState(false)

  const [dynamicAdapterInput, setDynamicAdapterInput] = useState('')
  const [dynamicAdapterInputError, setDynamicAdapterInputError] = useState(null)
  const [dynamicAdapterInputEdited, setDynamicAdapterInputEdited] =
    useState(false)

  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState('')
  const [registries, setRegistries] = useState([])

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await checkUpdates()
      await loadProvider()
      await loadSwarmGateway()
      await loadSwarmPostageStampId()
      await loadDynamicAdapter()
      await loadRegistries()
    }
    init()
    return () => {
      _isMounted = false
    }
  }, [])
  const checkUpdates = async () => {
    const { getNewExtensionVersion } = await initBGFunctions(browser)
    const isUpdateAvailable = await getNewExtensionVersion()
    onUpdateAvailable(isUpdateAvailable)
  }
  const loadProvider = async () => {
    const { getEthereumProvider } = await initBGFunctions(browser)
    const provider = await getEthereumProvider()
    setProviderInput(provider)
  }
  const setProvider = async (provider: string) => {
    try {
      const { setEthereumProvider } = await initBGFunctions(browser)
      await setEthereumProvider(provider)

      setProviderEdited(false)
    } catch (err) {
      setProviderEdited(false)
      setProviderInputError(err.message)
    }
  }

  const loadSwarmGateway = async () => {
    const { getSwarmGateway } = await initBGFunctions(browser)
    const gateway = await getSwarmGateway()
    setSwarmGatewayInput(gateway)
  }

  const setSwarmGateway = async (gateway: string) => {
    try {
      const { setSwarmGateway } = await initBGFunctions(browser)
      await setSwarmGateway(gateway)

      setSwarmGatewayEdited(false)
    } catch (err) {
      setSwarmGatewayEdited(false)
      setSwarmGatewayInputError(err.message)
    }
  }

  const loadSwarmPostageStampId = async () => {
    const { getSwarmPostageStampId } = await initBGFunctions(browser)
    const id = await getSwarmPostageStampId()
    setSwarmPostageStampIdInput(id)
  }

  const setSwarmPostageStampId = async (id: string) => {
    try {
      const { setSwarmPostageStampId } = await initBGFunctions(browser)
      await setSwarmPostageStampId(id)
      setSwarmPostageStampIdInputEdited(false)
    } catch (err) {
      setSwarmPostageStampIdInputEdited(false)
      setSwarmPostageStampIdInputError(err.message)
    }
  }

  const loadDynamicAdapter = async () => {
    const { getDynamicAdapter } = await initBGFunctions(browser)
    const dynamicAdapterInput = await getDynamicAdapter()

    setDynamicAdapterInput(dynamicAdapterInput)
  }

  const setDynamicAdapter = async (dynamicAdapter: string) => {
    const { setDynamicAdapter } = await initBGFunctions(browser)
    await setDynamicAdapter(dynamicAdapter)

    setDynamicAdapterInputEdited(false)
  }
  const loadRegistries = async () => {
    const { getRegistries } = await initBGFunctions(browser)
    const registries = await getRegistries()

    setRegistries(registries.filter((r) => r.isDev === false))
  }
  // const addRegistry = async (url: string) => {
  //   const { addRegistry } = await initBGFunctions(browser)

  //   try {
  //     await addRegistry(url, false)
  //     setRegistryInput(registryInput)
  //   } catch (err) {
  //     setRegistryInputError(err.message)
  //   }

  //   loadRegistries()
  // }

  // const removeRegistry = async (url: string) => {
  //   const { removeRegistry } = await initBGFunctions(browser)
  //   await removeRegistry(url)
  //   loadRegistries()
  // }

  // const enableRegistry = async (url: string) => {
  //   const { enableRegistry } = await initBGFunctions(browser)
  //   await enableRegistry(url)
  //   loadRegistries()
  // }

  setProvider(providerInput)
  setSwarmGateway(swarmGatewayInput)
  setSwarmPostageStampId(swarmPostageStampIdInput)
  setDynamicAdapter(dynamicAdapterInput)
  return (
    <>
      <SettingWrapper
        title="Social"
        children={
          <>
            <SettingItem
              title="Version"
              component={
                <div className={styles.version}>
                  <span className={styles.versionTitle}>
                    {EXTENSION_VERSION}
                  </span>
                  {isUpdateAvailable ? (
                    <button
                      className={styles.versionButton}
                      onClick={() =>
                        window.open(
                          `https://github.com/dapplets/dapplet-extension/releases`,
                          '_blank'
                        )
                      }
                    >
                      Update
                    </button>
                  ) : null}
                </div>
              }
            />
            {/* Todo : on Parameters */}
            <SettingItem
              title="Regestries"
              component={<></>}
              children={<DropdownSettings />}
            />
          </>
        }
      />

      <SettingWrapper
        title="Core settings"
        children={
          <>
            {/* <SettingItem
                    title="Registry"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={<InputPanel placeholder="Placeholder" />}
                  /> */}
            <SettingItem
              title="User Agent Name"
              component={<Dropdown list={DROPDOWN_LIST} />}
              children={
                <InputPanel placeholder="eda881d858ae4a25b2dfbbd0b4629992" />
              }
            />
            <SettingItem
              title="Dynamic Adapter"
              component={<Dropdown list={DROPDOWN_LIST} />}
              children={
                <InputPanel
                  value={dynamicAdapterInput}
                  error={!!dynamicAdapterInputError}
                  onChange={(e) => {
                    setDynamicAdapter(e.target.value)
                    setDynamicAdapterInputError(null)
                    setDynamicAdapterInputEdited(true)
                  }}
                  placeholder="dynamic-adapter.dapplet-base.eth#default@..."
                />
              }
            />
            <SettingItem
              title=" Prefered Overlay Storage"
              component={<Dropdown list={DROPDOWN_LIST} />}
            />

            {/* 
            // Prefered Overlay Storage */}
          </>
        }
      />
      <SettingWrapper
        title="Swarm setup"
        children={
          <>
            <SettingItem
              title="Swarm Gateway"
              component={<Dropdown list={DROPDOWN_LIST} />}
              children={
                <InputPanel
                  value={swarmGatewayInput}
                  error={!isValidHttp(swarmGatewayInput)}
                  onChange={(e) => {
                    setSwarmGatewayInput(e.target.value)
                    setSwarmGatewayInputError(null)
                    setSwarmGatewayEdited(true)
                  }}
                  placeholder="http:\\bee.dapplets.org\"
                />
              }
            />
            <SettingItem
              title="Swarm Postage Stamp ID"
              component={<Dropdown list={DROPDOWN_LIST} />}
              children={
                <InputPanel
                  value={swarmPostageStampIdInput}
                  error={
                    !!swarmPostageStampIdInputError ||
                    !isValidPostageStampId(swarmPostageStampIdInput)
                  }
                  onChange={(e) => {
                    setSwarmPostageStampIdInput(e.target.value)
                    setSwarmPostageStampIdInputError(null)
                    setSwarmPostageStampIdInputEdited(true)
                  }}
                  placeholder="Swarm Postage Stamp ID"
                />
              }
            />
          </>
        }
      />
      <SettingWrapper
        title="Ethereum setup"
        children={
          <SettingItem
            title="Ethereum Provider"
            component={<Dropdown list={DROPDOWN_LIST} />}
            children={
              <InputPanel
                onChange={(e) => {
                  setProviderInput(e.target.value)
                  setProviderEdited(true)
                  setProviderInputError(null)
                }}
                error={!isValidHttp(providerInput)}
                value={providerInput}
                placeholder="eda881d858ae4a25b2dfbbd0b4629992"
              />
            }
          />
        }
      />
    </>
  )
}
