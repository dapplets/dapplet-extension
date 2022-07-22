import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageTypes } from '../../../../../common/constants'
import { isValidPostageStampId } from '../../../../../popup/helpers'
import { Checkbox } from '../../components/Checkbox'
import { DropdownPreferedOverlayStorage } from '../../components/DropdownPreferedOverlayStorage'
import { DropdownRegistery } from '../../components/DropdownRegistery'
import { DropdownTrustedUsers } from '../../components/DropdownTrustedUsers'
import { InputPanelSettings } from '../../components/InputPanelSettings'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Switch } from '../../components/Switch'

import styles from './Settings.module.scss'

export const DROPDOWN_LIST = [{ _id: '0', label: 'Custom' }]

export interface SettingsListProps {
  devModeProps: boolean
  setDevMode: (x) => void
  errorReporting: boolean
  setErrorReporting: (x) => void
  isSvgLoaderDevMode: boolean
  isSvgErrorReporting: boolean
}
export const SettingsList: FC<SettingsListProps> = (props) => {
  const {
    devModeProps,
    setDevMode,
    errorReporting,
    setErrorReporting,
    isSvgLoaderDevMode,
    isSvgErrorReporting,
  } = props
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)

  const [providerInput, setProviderInput] = useState('')
  const [providerInputError, setProviderInputError] = useState(null)
  const [providerInputDefault, setProviderInputDefault] = useState('')

  const [swarmGatewayInput, setSwarmGatewayInput] = useState('')
  const [swarmGatewayInputError, setSwarmGatewayInputError] = useState(null)
  const [swarmGatewayInputDefault, setSwarmGatewayInputDefault] = useState('')

  const [swarmPostageStampIdInput, setSwarmPostageStampIdInput] = useState('')
  const [swarmPostageStampIdInputError, setSwarmPostageStampIdInputError] = useState(null)
  const [swarmPostageStampIdInputDefault, setSwarmPostageStampIdInputDefault] = useState('')

  const [dynamicAdapterInput, setDynamicAdapterInput] = useState('')
  const [dynamicAdapterInputError, setDynamicAdapterInputError] = useState(null)
  const [dynamicAdapterInputDefault, setDynamicAdapterInputDefault] = useState('')

  const [userAgentNameInput, setUserAgentNameInput] = useState('')
  const [userAgentNameInputError, setUserAgentNameInputError] = useState(null)

  const [ipfsGatewayInput, setIpfsGatewayInput] = useState('')
  const [ipfsGatewayInputError, setIpfsGatewayInputError] = useState(null)
  const [ipfsGatewayInputDefault, setIpfsGatewayInputDefault] = useState('')

  const [siaPortalInput, setSiaPortalInput] = useState('')
  const [siaPortalInputError, setSiaPortalInputError] = useState(null)
  const [siaPortalInputDefault, setSiaPortalInputDefault] = useState('')

  const [targetStorages, setTargetStorages] = useState([])

  // const [isPopup, setPopup] = useState(false)

  const regExpUserAgentName = new RegExp(/^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$/)
  const inputOfFocusIPFS = useRef<HTMLInputElement>()
  const inputOfFocusSia = useRef<HTMLInputElement>()
  const inputOfFocusSwarmId = useRef<HTMLInputElement>()
  const inputOfFocusSwarm = useRef<HTMLInputElement>()
  const inputOfFocusEtn = useRef<HTMLInputElement>()
  const inputOfFocusAdapter = useRef<HTMLInputElement>()
  const inputOfFocusAgentName = useRef<HTMLInputElement>()

  const _isMounted = useRef(true)

  useEffect(() => {
    const init = async () => {
      if (_isMounted.current) {
        await checkUpdates()

        await loadProvider()
        await loadSwarmGateway()
        await loadErrorReporting()
        await loadSwarmPostageStampId()
        await loadDynamicAdapter()

        await loadUserAgentId()
        await loadUserAgentName()
        await loadIpfsGateway()
        await loadSiaPortal()
        await loadTargetStorages()
      }
    }
    init()

    return () => {
      _isMounted.current = false
    }
  }, [])

  const getValidUserAgentName = (value, reg) => {
    try {
      const valueReg = value.match(reg)

      return valueReg
    } catch {}
  }

  const loadErrorReporting = async () => {
    const { getErrorReporting } = await initBGFunctions(browser)
    const errorReporting = await getErrorReporting()
    setErrorReporting(errorReporting)
  }
  const checkUpdates = async () => {
    const { getNewExtensionVersion } = await initBGFunctions(browser)
    const isUpdateAvailable = await getNewExtensionVersion()
    onUpdateAvailable(isUpdateAvailable)
  }
  const loadProvider = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.providerUrl) {
      setProviderInputDefault(config.providerUrl)
    }
    const { getEthereumProvider } = await initBGFunctions(browser)
    const provider = await getEthereumProvider()
    setProviderInput(provider)
  }
  const setProvider = async (provider: string) => {
    try {
      const { setEthereumProvider } = await initBGFunctions(browser)
      await setEthereumProvider(provider)
      loadProvider()
    } catch (err) {
      setProviderInputError(err.message)
      setTimeout(() => {
        setProviderInputError(null)
      }, 3000)
    }
  }

  const loadSwarmGateway = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.swarmGatewayUrl) {
      setSwarmGatewayInputDefault(config.swarmGatewayUrl)
    }
    const { getSwarmGateway } = await initBGFunctions(browser)
    const gateway = await getSwarmGateway()
    setSwarmGatewayInput(gateway)
  }

  const setSwarmGateway = async (gateway: string) => {
    try {
      const { setSwarmGateway } = await initBGFunctions(browser)
      await setSwarmGateway(gateway)
      loadSwarmGateway()
    } catch (err) {
      setSwarmGatewayInputError(err.message)
      setTimeout(() => {
        setSwarmGatewayInputError(null)
      }, 3000)
    }
  }

  const loadSwarmPostageStampId = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.swarmPostageStampId) {
      setSwarmPostageStampIdInputDefault(config.swarmPostageStampId)
    }
    const { getSwarmPostageStampId } = await initBGFunctions(browser)
    const id = await getSwarmPostageStampId()
    setSwarmPostageStampIdInput(id)
  }

  const setSwarmPostageStampId = async (id: string) => {
    try {
      const { setSwarmPostageStampId } = await initBGFunctions(browser)
      await setSwarmPostageStampId(id)
      loadSwarmPostageStampId()
    } catch (err) {
      setSwarmPostageStampIdInputError(err.message)

      setTimeout(() => {
        setSwarmPostageStampIdInputError(null)
      }, 3000)
    }
  }

  const loadDynamicAdapter = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.dynamicAdapter) {
      setDynamicAdapterInputDefault(config.dynamicAdapter)
    }
    const { getDynamicAdapter } = await initBGFunctions(browser)
    const dynamicAdapterInput = await getDynamicAdapter()

    setDynamicAdapterInput(dynamicAdapterInput)
  }

  const setDynamicAdapter = async (dynamicAdapter: string) => {
    try {
      const { setDynamicAdapter } = await initBGFunctions(browser)
      await setDynamicAdapter(dynamicAdapter)
      loadDynamicAdapter()
    } catch (error) {
      setDynamicAdapterInputError(error.message)
    }
  }

  const loadUserAgentId = async () => {
    const { getUserAgentId } = await initBGFunctions(browser)
    const userAgentId = await getUserAgentId()
  }

  const loadUserAgentName = async () => {
    const { getUserAgentName } = await initBGFunctions(browser)
    const userAgentNameInput = await getUserAgentName()

    setUserAgentNameInput(userAgentNameInput)
  }

  const setUserAgentName = async (userAgentName: string) => {
    const valueParse = getValidUserAgentName(userAgentNameInput, regExpUserAgentName)
    if (valueParse !== null) {
      const { setUserAgentName } = await initBGFunctions(browser)
      await setUserAgentName(userAgentName)
      loadUserAgentName()
    } else {
      setUserAgentNameInputError('Enter User Agent Name')
      setUserAgentNameInput('')
      setTimeout(() => {
        setUserAgentNameInputError(null)
      }, 3000)
    }
  }

  const loadIpfsGateway = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.ipfsGatewayUrl) {
      setIpfsGatewayInputDefault(config.ipfsGatewayUrl)
    }
    const { getIpfsGateway } = await initBGFunctions(browser)
    const gateway = await getIpfsGateway()
    setIpfsGatewayInput(gateway)
  }

  const setIpfsGateway = async (gateway: string) => {
    try {
      const { setIpfsGateway } = await initBGFunctions(browser)
      await setIpfsGateway(gateway)
      loadIpfsGateway()
    } catch (err) {
      setIpfsGatewayInputError(err.message)
      setTimeout(() => {
        setIpfsGatewayInputError(null)
      }, 3000)
    }
  }

  const loadSiaPortal = async () => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.siaPortalUrl) {
      setSiaPortalInputDefault(config.siaPortalUrl)
    }
    const { getSiaPortal } = await initBGFunctions(browser)
    const gateway = await getSiaPortal()
    setSiaPortalInput(gateway)
  }

  const setSiaPortal = async (gateway: string) => {
    try {
      const { setSiaPortal } = await initBGFunctions(browser)
      await setSiaPortal(gateway)
      loadSiaPortal()
    } catch (err) {
      setSiaPortalInputError(err.message)
      setTimeout(() => {
        setSiaPortalInputError(null)
      }, 3000)
    }
  }
  const changeTargetStorage = async (storage: StorageTypes, checked: boolean) => {
    const { updateTargetStorages } = await initBGFunctions(browser)

    const newTarget = targetStorages.filter((x) => x !== storage)

    if (checked) newTarget.push(storage)
    await updateTargetStorages(newTarget)
    loadTargetStorages()
  }
  const loadTargetStorages = async () => {
    const { getTargetStorages } = await initBGFunctions(browser)
    const loadTarget = await getTargetStorages()

    setTargetStorages(loadTarget)
  }

  const getDefaultValueProvider = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.providerUrl !== inputValue) {
      await setProvider(config.providerUrl)
    }
  }

  const onPress = (e, ref) => {
    ref.current?.blur()
  }

  return (
    <div className={styles.blockSettings}>
      <div className={styles.scrollBlock}>
        <SettingWrapper
          className={styles.wrapperSettings}
          title="Social"
          children={
            <>
              <SettingItem
                title="Version"
                component={
                  <div className={styles.version}>
                    <span className={styles.versionTitle}>{EXTENSION_VERSION}</span>
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
              <SettingItem
                title="Trusted Users"
                component={<></>}
                children={<DropdownTrustedUsers />}
              />

              <SettingItem
                title="Developer mode"
                component={
                  <>
                    {isSvgLoaderDevMode ? (
                      <span className={styles.loader}></span>
                    ) : (
                      <Switch checked={devModeProps} onChange={() => setDevMode(!devModeProps)} />
                    )}
                  </>
                }
              />
              <SettingItem
                title="Bug reports"
                component={
                  <>
                    {isSvgErrorReporting ? (
                      <span className={styles.loader}></span>
                    ) : (
                      <Switch
                        checked={errorReporting}
                        onChange={() => setErrorReporting(!errorReporting)}
                      />
                    )}
                  </>
                }
              />
              {/* <SettingItem
                title="Open popup"
                component={
                  <Switch onChange={() => setPopupInOverlay(!isPopup)} checked={isPopup} />
                }
              /> */}
              <SettingItem
                title="User Agent Name"
                component={<></>}
                children={
                  <>
                    <form
                      onBlur={() => {
                        setUserAgentNameInputError(null)
                      }}
                      onSubmit={(e) => {
                        e.preventDefault()

                        setUserAgentName(userAgentNameInput)
                        onPress(e, inputOfFocusAgentName)
                      }}
                      className={cn(styles.formDefault, {
                        [styles.errorInputDefault]: !!userAgentNameInputError,
                      })}
                    >
                      <input
                        spellCheck={false}
                        className={cn(styles.inputDefault, {})}
                        placeholder={userAgentNameInput}
                        ref={inputOfFocusAgentName}
                        value={userAgentNameInput}
                        onFocus={() => {
                          setUserAgentNameInput('')
                          setUserAgentNameInputError(null)
                        }}
                        onChange={(e) => {
                          setUserAgentNameInput(e.target.value)
                          setUserAgentNameInputError(null)
                        }}
                      />
                    </form>
                    {userAgentNameInputError ? (
                      <div className={styles.errorMessage}>{userAgentNameInputError}</div>
                    ) : null}
                  </>
                }
              />
            </>
          }
        />

        <SettingWrapper
          className={styles.wrapperSettings}
          title="Parameters"
          children={
            <>
              <SettingItem title="Registries" component={<></>} children={<DropdownRegistery />} />
              <SettingItem
                title="Dynamic Adapter"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={true}
                    isDefaultValueInput={dynamicAdapterInputDefault}
                    isPostStampId={false}
                    isValidHttpFunction={false}
                    providerInputError={dynamicAdapterInputError}
                    providerInput={dynamicAdapterInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(
                        dynamicAdapterInput,
                        'dynamicAdapter',
                        setDynamicAdapter
                      )
                    }
                    setProviderInputError={setDynamicAdapterInputError}
                    setProviderInput={setDynamicAdapterInput}
                    setProvider={setDynamicAdapter}
                    onPress={onPress}
                    inputOfFocusEtn={inputOfFocusAdapter}
                  />
                }
              />
              <SettingItem
                title="Prefered Overlay Storage"
                component={<></>}
                children={<DropdownPreferedOverlayStorage />}
              />
              <SettingItem
                title="Storages"
                component={<></>}
                children={
                  <div className={styles.checkboxBlock}>
                    <Checkbox isSupport isReadonly isCheckbox title="Centralized" />

                    <Checkbox
                      isCheckbox={targetStorages?.includes(StorageTypes.Sia)}
                      title="SIA"
                      onChange={(e) => {
                        changeTargetStorage(StorageTypes.Sia, e.target.checked)
                      }}
                    />
                    <Checkbox
                      isCheckbox={targetStorages?.includes(StorageTypes.Ipfs)}
                      title="IPFS"
                      onChange={(e) => {
                        changeTargetStorage(StorageTypes.Ipfs, e.target.checked)
                      }}
                    />

                    <Checkbox
                      title="Swarm"
                      isCheckbox={targetStorages?.includes(StorageTypes.Swarm)}
                      onChange={(e) => {
                        changeTargetStorage(StorageTypes.Swarm, e.target.checked)
                      }}
                    />
                  </div>
                }
              />
            </>
          }
        />
        <SettingWrapper
          title="Providers"
          children={
            <>
              <SettingItem
                title="Ethereum Provider"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={false}
                    isDefaultValueInput={providerInputDefault}
                    isPostStampId={false}
                    isValidHttpFunction={true}
                    providerInputError={providerInputError}
                    providerInput={providerInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(providerInput, 'providerUrl', setProvider)
                    }
                    setProviderInputError={setProviderInputError}
                    setProviderInput={setProviderInput}
                    setProvider={setProvider}
                    onPress={onPress}
                    inputOfFocusEtn={inputOfFocusEtn}
                  />
                }
              />
              <SettingItem
                title="Swarm Gateway"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={false}
                    isDefaultValueInput={swarmGatewayInputDefault}
                    isPostStampId={false}
                    isValidHttpFunction={true}
                    providerInputError={swarmGatewayInputError}
                    providerInput={swarmGatewayInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(swarmGatewayInput, 'swarmGatewayUrl', setSwarmGateway)
                    }
                    setProviderInputError={setSwarmGatewayInputError}
                    setProviderInput={setSwarmGatewayInput}
                    setProvider={setSwarmGateway}
                    onPress={onPress}
                    inputOfFocusEtn={inputOfFocusSwarm}
                  />
                }
              />
              <SettingItem
                title="Swarm Postage Stamp ID"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={false}
                    isDefaultValueInput={swarmPostageStampIdInputDefault}
                    isPostStampId={true}
                    isValidHttpFunction={false}
                    isValidPostageStampId={isValidPostageStampId}
                    providerInputError={swarmPostageStampIdInputError}
                    providerInput={swarmPostageStampIdInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(
                        swarmPostageStampIdInput,
                        'swarmPostageStampId',
                        setSwarmPostageStampId
                      )
                    }
                    setProviderInputError={setSwarmPostageStampIdInputError}
                    setProviderInput={setSwarmPostageStampIdInput}
                    setProvider={setSwarmPostageStampId}
                    inputOfFocusEtn={inputOfFocusSwarmId}
                  />
                }
              />
              <SettingItem
                title="IPFS Gateway"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={false}
                    isDefaultValueInput={ipfsGatewayInputDefault}
                    isPostStampId={false}
                    isValidHttpFunction={true}
                    providerInputError={ipfsGatewayInputError}
                    providerInput={ipfsGatewayInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(ipfsGatewayInput, 'ipfsGatewayUrl', setIpfsGateway)
                    }
                    setProviderInputError={setIpfsGatewayInputError}
                    setProviderInput={setIpfsGatewayInput}
                    setProvider={setIpfsGateway}
                    onPress={onPress}
                    inputOfFocusEtn={inputOfFocusIPFS}
                  />
                }
              />
              <SettingItem
                title="SIA Portal"
                component={<></>}
                children={
                  <InputPanelSettings
                    isDynamycAdapter={false}
                    isDefaultValueInput={siaPortalInputDefault}
                    isPostStampId={false}
                    isValidHttpFunction={true}
                    providerInputError={siaPortalInputError}
                    providerInput={siaPortalInput}
                    getDefaultValueProvider={() =>
                      getDefaultValueProvider(siaPortalInput, 'siaPortalUrl', setSiaPortal)
                    }
                    setProviderInputError={setSiaPortalInputError}
                    setProviderInput={setSiaPortalInput}
                    setProvider={setSiaPortal}
                    onPress={onPress}
                    inputOfFocusEtn={inputOfFocusSia}
                  />
                }
              />
            </>
          }
        />
      </div>
    </div>
  )
}
