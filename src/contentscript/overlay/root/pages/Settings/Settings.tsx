import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageTypes } from '../../../../../common/constants'
import { parseModuleName } from '../../../../../common/helpers'
import { isValidHttp, isValidPostageStampId } from '../../../../../popup/helpers'
import { Checkbox } from '../../components/Checkbox'
import { DropdownPreferedOverlayStorage } from '../../components/DropdownPreferedOverlayStorage'
import { DropdownRegistery } from '../../components/DropdownRegistery'
import { DropdownTrustedUsers } from '../../components/DropdownTrustedUsers'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Switch } from '../../components/Switch'
import styles from './Settings.module.scss'

export const DROPDOWN_LIST = [{ _id: '0', label: 'Custom' }]
let _isMounted = false
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
  const [providerEdited, setProviderEdited] = useState(false)
  const [providerInputError, setProviderInputError] = useState(null)
  const [providerLoading, setProviderLoading] = useState(false)

  const [swarmGatewayInput, setSwarmGatewayInput] = useState('')
  const [swarmGatewayInputError, setSwarmGatewayInputError] = useState(null)
  const [swarmGatewayEdited, setSwarmGatewayEdited] = useState(false)
  const [swarmGatewayLoading, setSwarmGatewayLoading] = useState(false)

  const [swarmPostageStampIdInput, setSwarmPostageStampIdInput] = useState('')
  const [swarmPostageStampIdInputError, setSwarmPostageStampIdInputError] = useState(null)
  const [swarmPostageStampIdInputEdited, setSwarmPostageStampIdInputEdited] = useState(false)
  const [swarmPostageStampIdLoading, setSwarmPostageStampIdLoading] = useState(false)

  const [dynamicAdapterInput, setDynamicAdapterInput] = useState('')
  const [dynamicAdapterInputError, setDynamicAdapterInputError] = useState(null)
  const [dynamicAdapterInputEdited, setDynamicAdapterInputEdited] = useState(false)
  const [dynamicAdapterLoading, setDynamicAdapterLoading] = useState(false)

  const [registryInput, setRegistryInput] = useState('')
  const [registryInputError, setRegistryInputError] = useState(null)
  const [registries, setRegistries] = useState([])

  const [userAgentNameInput, setUserAgentNameInput] = useState('')
  const [userAgentId, setUserAgentID] = useState('')
  const [userAgentNameInputError, setUserAgentNameInputError] = useState(null)
  const [userAgentNameLoading, setUserAgentNameLoading] = useState(false)
  const [userAgentNameEdited, setUserAgentNameEdited] = useState(false)

  const [ipfsGatewayInput, setIpfsGatewayInput] = useState('')
  const [ipfsGatewayInputError, setIpfsGatewayInputError] = useState(null)
  const [ipfsGatewayLoading, setIpfsGatewayLoading] = useState(false)
  const [ipfsGatewayEdited, setIpfsGatewayEdited] = useState(false)

  const [siaPortalInput, setSiaPortalInput] = useState('')
  const [siaPortalInputError, setSiaPortalInputError] = useState(null)
  const [siaPortalLoading, setSiaPortalLoading] = useState(false)
  const [siaPortalEdited, setSiaPortalEdited] = useState(false)

  const [targetStorages, setTargetStorages] = useState([
    // StorageTypes.Swarm,
    // StorageTypes.Sia,
    // StorageTypes.Ipfs,
  ])
  //   [
  //   StorageTypes.Swarm,
  //   StorageTypes.Sia,
  //   StorageTypes.Ipfs,
  // ]
  const [checkedSia, setCheckedSia] = useState(true)
  const [checkedIPFS, setCheckedIPFS] = useState(true)
  const [checkedSwarm, setCheckedSwarm] = useState(true)

  const [isPopup, setPopup] = useState(false)

  const regExpUserAgentName = new RegExp(/^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$/)
  const inputOfFocusIPFS = useRef<HTMLInputElement>()
  const inputOfFocusSia = useRef<HTMLInputElement>()
  const inputOfFocusSwarmId = useRef<HTMLInputElement>()
  const inputOfFocusSwarm = useRef<HTMLInputElement>()
  const inputOfFocusEtn = useRef<HTMLInputElement>()
  const inputOfFocusAdapter = useRef<HTMLInputElement>()
  const inputOfFocusAgentName = useRef<HTMLInputElement>()

  useEffect(() => {
    _isMounted = true
    const init = async () => {
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
      await loadPopupInOverlay()
      await loadTargetStorages()
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [])

  const getValidUserAgentName = (value, reg) => {
    try {
      let numEl = value.match(reg)

      return numEl
    } catch {}
  }

  const loadDevMode = async () => {
    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()
    setDevMode(devMode)
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
    const { getEthereumProvider } = await initBGFunctions(browser)
    const provider = await getEthereumProvider()
    setProviderInput(provider)
  }
  const setProvider = async (provider: string) => {
    try {
      setProviderLoading(true)

      const { setEthereumProvider } = await initBGFunctions(browser)
      await setEthereumProvider(provider)
      loadProvider()
      setProviderLoading(false)
      setProviderEdited(false)
    } catch (err) {
      setProviderLoading(false)
      setProviderEdited(false)
      setProviderInputError(err.message)
      setTimeout(() => {
        setProviderInputError(null)
      }, 3000)
    }
  }

  const loadSwarmGateway = async () => {
    const { getSwarmGateway } = await initBGFunctions(browser)
    const gateway = await getSwarmGateway()
    setSwarmGatewayInput(gateway)
  }

  const setSwarmGateway = async (gateway: string) => {
    try {
      setSwarmGatewayLoading(true)
      const { setSwarmGateway } = await initBGFunctions(browser)
      await setSwarmGateway(gateway)
      loadSwarmGateway()
      setSwarmGatewayEdited(false)
      setSwarmGatewayLoading(false)
    } catch (err) {
      setSwarmGatewayEdited(false)
      setSwarmGatewayLoading(false)
      setSwarmGatewayInputError(err.message)
      setTimeout(() => {
        setSwarmGatewayInputError(null)
      }, 3000)
    }
  }

  const loadSwarmPostageStampId = async () => {
    const { getSwarmPostageStampId } = await initBGFunctions(browser)
    const id = await getSwarmPostageStampId()
    setSwarmPostageStampIdInput(id)
  }

  const setSwarmPostageStampId = async (id: string) => {
    try {
      setSwarmPostageStampIdLoading(true)

      const { setSwarmPostageStampId } = await initBGFunctions(browser)
      await setSwarmPostageStampId(id)
      loadSwarmPostageStampId()
      setSwarmPostageStampIdLoading(false)
      setSwarmPostageStampIdInputEdited(false)
    } catch (err) {
      setSwarmPostageStampIdLoading(false)
      setSwarmPostageStampIdInputEdited(false)
      setSwarmPostageStampIdInputError(err.message)

      setTimeout(() => {
        setSwarmPostageStampIdInputError(null)
      }, 3000)
    }
  }

  const loadDynamicAdapter = async () => {
    const { getDynamicAdapter } = await initBGFunctions(browser)
    const dynamicAdapterInput = await getDynamicAdapter()

    setDynamicAdapterInput(dynamicAdapterInput)
  }

  const setDynamicAdapter = async (dynamicAdapter: string) => {
    try {
      setDynamicAdapterLoading(true)

      const { setDynamicAdapter } = await initBGFunctions(browser)
      await setDynamicAdapter(dynamicAdapter)
      loadDynamicAdapter()
      setDynamicAdapterLoading(false)
      setDynamicAdapterInputEdited(false)
    } catch (error) {
      setDynamicAdapterLoading(false)
      setDynamicAdapterInputEdited(false)
      setDynamicAdapterInputError(error.message)
    }
  }

  const loadUserAgentId = async () => {
    const { getUserAgentId } = await initBGFunctions(browser)
    const userAgentId = await getUserAgentId()

    setUserAgentID(userAgentId)
  }

  const loadUserAgentName = async () => {
    const { getUserAgentName } = await initBGFunctions(browser)
    const userAgentNameInput = await getUserAgentName()

    setUserAgentNameInput(userAgentNameInput)
  }

  const setUserAgentName = async (userAgentName: string) => {
    setUserAgentNameLoading(true)
    const valueParse = getValidUserAgentName(userAgentNameInput, regExpUserAgentName)
    if (valueParse !== null) {
      const { setUserAgentName } = await initBGFunctions(browser)
      await setUserAgentName(userAgentName)
      loadUserAgentName()
      setUserAgentNameLoading(false)
      setUserAgentNameEdited(false)
    } else {
      setUserAgentNameInputError('Enter User Agent Name')
      setUserAgentNameInput('')
      setTimeout(() => {
        setUserAgentNameInputError(null)
      }, 3000)
    }
  }

  const loadIpfsGateway = async () => {
    const { getIpfsGateway } = await initBGFunctions(browser)
    const gateway = await getIpfsGateway()
    setIpfsGatewayInput(gateway)
  }

  const setIpfsGateway = async (gateway: string) => {
    try {
      setIpfsGatewayLoading(true)
      const { setIpfsGateway } = await initBGFunctions(browser)
      await setIpfsGateway(gateway)
      loadIpfsGateway()
      setIpfsGatewayLoading(false)
      setIpfsGatewayEdited(false)
    } catch (err) {
      setIpfsGatewayLoading(false)
      setIpfsGatewayEdited(false)
      setIpfsGatewayInputError(err.message)
      setTimeout(() => {
        setIpfsGatewayInputError(null)
      }, 3000)
    }
  }

  const loadSiaPortal = async () => {
    const { getSiaPortal } = await initBGFunctions(browser)
    const gateway = await getSiaPortal()
    setSiaPortalInput(gateway)
  }

  const setSiaPortal = async (gateway: string) => {
    try {
      setSiaPortalLoading(true)

      const { setSiaPortal } = await initBGFunctions(browser)
      await setSiaPortal(gateway)
      loadSiaPortal()
      setSiaPortalLoading(false)
      setSiaPortalEdited(false)
    } catch (err) {
      setSiaPortalLoading(false)
      setSiaPortalEdited(false)
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

  const getDefaultValueDynamicAdapter = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.dynamicAdapter !== inputValue) {
      await setDynamicAdapter(config.dynamicAdapter)
    }
  }
  const getDefaultValueProvider = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.providerUrl !== inputValue) {
      await setProvider(config.providerUrl)
    }
  }
  const getDefaultValueSwarmGateway = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.swarmGatewayUrl !== inputValue) {
      setSwarmGateway(config.swarmGatewayUrl)
    }
  }
  const getDefaultValueSwarmPostageStampId = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.swarmPostageStampId !== inputValue) {
      setSwarmPostageStampId(config.swarmPostageStampId)
    }
  }
  const getDefaultValueIpfsGateway = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.ipfsGatewayUrl !== inputValue) {
      setIpfsGateway(config.ipfsGatewayUrl)
    }
  }
  const getDefaultValueSiaPortal = async (inputValue: string) => {
    const { getInitialConfig } = await initBGFunctions(browser)
    const config = await getInitialConfig()

    if (config.siaPortalUrl !== inputValue) {
      setSiaPortal(config.siaPortalUrl)
    }
  }

  const loadPopupInOverlay = async () => {
    const { getPopupInOverlay } = await initBGFunctions(browser)
    const popupInOverlay = await getPopupInOverlay()
    setPopup(popupInOverlay)
  }

  const setPopupInOverlay = async (isActive: boolean) => {
    const { setPopupInOverlay } = await initBGFunctions(browser)
    await setPopupInOverlay(isActive)
    loadPopupInOverlay()
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
              <SettingItem
                title="Open popup"
                component={
                  <Switch onChange={() => setPopupInOverlay(!isPopup)} checked={isPopup} />
                }
              />
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

                        // !(userAgentNameLoading || !userAgentNameEdited) &&
                        setUserAgentName(userAgentNameInput)
                        onPress(e, inputOfFocusAgentName)
                      }}
                      className={cn(styles.formDefault, {
                        [styles.errorInputDefault]: !!userAgentNameInputError,
                      })}
                    >
                      <input
                        className={cn(styles.inputDefault, {})}
                        placeholder={userAgentNameInput}
                        ref={inputOfFocusAgentName}
                        onFocus={() => {
                          setUserAgentNameInput('')
                          setUserAgentNameInputError(null)
                        }}
                        onChange={(e) => {
                          setUserAgentNameInput(e.target.value)
                          setUserAgentNameEdited(true)
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
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]: dynamicAdapterInputError,
                        //  ||
                        // !parseModuleName(dynamicAdapterInput),
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={() => {
                          setDynamicAdapterInputError(null)
                          // getDefaultValueDynamicAdapter(dynamicAdapterInput)
                          if (
                            parseModuleName(dynamicAdapterInput).branch === null ||
                            parseModuleName(dynamicAdapterInput).name === null ||
                            parseModuleName(dynamicAdapterInput).version === null
                          ) {
                            getDefaultValueDynamicAdapter(dynamicAdapterInput)
                            // setTimeout(() => {
                            //   setDynamicAdapterInputError(null)
                            // }, 3000)
                          }
                          if (dynamicAdapterInput.length === 0) {
                            getDefaultValueDynamicAdapter(dynamicAdapterInput)
                          }
                          // console.log(parseModuleName(dynamicAdapterInput))
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()

                          setDynamicAdapter(dynamicAdapterInput)
                          if (
                            // parseModuleName(dynamicAdapterInput).branch !==
                            //   null &&
                            parseModuleName(dynamicAdapterInput).name !== null &&
                            parseModuleName(dynamicAdapterInput).version !== null
                          ) {
                            setDynamicAdapter(dynamicAdapterInput)
                          } else if (
                            parseModuleName(dynamicAdapterInput).branch === null ||
                            parseModuleName(dynamicAdapterInput).name === null ||
                            parseModuleName(dynamicAdapterInput).version === null
                          ) {
                            setDynamicAdapterInputError('Enter a valid value')
                            getDefaultValueDynamicAdapter(dynamicAdapterInput)
                            setTimeout(() => {
                              setDynamicAdapterInputError(null)
                            }, 3000)
                          }
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={dynamicAdapterInput}
                          placeholder={dynamicAdapterInput}
                          onFocus={() => {
                            setDynamicAdapterInput('')
                            setDynamicAdapterInputError(null)
                          }}
                          ref={inputOfFocusAdapter}
                          onChange={(e) => {
                            // e.preventDefault()
                            setDynamicAdapterInput(e.target.value)
                            setDynamicAdapterInputError(null)
                            setDynamicAdapterInputEdited(true)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()

                          getDefaultValueDynamicAdapter(dynamicAdapterInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {dynamicAdapterInputError ? (
                      <div className={styles.errorMessage}>{dynamicAdapterInputError}</div>
                    ) : null}
                  </>
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
                    <Checkbox isSupport isCheckbox title="Centralized" />

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
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]:
                          (!!providerInputError && !isValidHttp(providerInput)) ||
                          providerInputError,
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={() => {
                          setProviderInputError(null)
                          if (!isValidHttp(providerInput)) {
                            getDefaultValueProvider(providerInput)
                          }
                          if (providerInput.length === 0) {
                            getDefaultValueProvider(providerInput)
                          }
                        }}
                        onFocus={() => {
                          setProviderInput('')
                          setProviderInputError(null)
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()

                          setProvider(providerInput)
                          onPress(e, inputOfFocusEtn)
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={providerInput || ''}
                          ref={inputOfFocusEtn}
                          onChange={(e) => {
                            setProviderInput(e.target.value)
                            setProviderEdited(true)
                            setProviderInputError(null)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()

                          getDefaultValueProvider(providerInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {providerInputError ? (
                      <div className={styles.errorMessage}>{providerInputError}</div>
                    ) : null}
                  </>
                }
              />
              <SettingItem
                title="Swarm Gateway"
                component={<></>}
                children={
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]:
                          (!!swarmGatewayInputError && !isValidHttp(swarmGatewayInput)) ||
                          swarmGatewayInputError,
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={() => {
                          setSwarmGatewayInputError(null)
                          if (!isValidHttp(swarmGatewayInput)) {
                            getDefaultValueSwarmGateway(swarmGatewayInput)
                          }
                          if (swarmGatewayInput.length === 0) {
                            getDefaultValueSwarmGateway(swarmGatewayInput)
                          }
                        }}
                        onFocus={() => {
                          setSwarmGatewayInput('')
                          setSwarmGatewayInputError(null)
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()

                          setSwarmGateway(swarmGatewayInput)
                          onPress(e, inputOfFocusSwarm)
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={swarmGatewayInput}
                          ref={inputOfFocusSwarm}
                          onChange={(e) => {
                            setSwarmGatewayInput(e.target.value)
                            setSwarmGatewayInputError(null)
                            setSwarmGatewayEdited(true)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          getDefaultValueSwarmGateway(swarmGatewayInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {swarmGatewayInputError ? (
                      <div className={styles.errorMessage}>{swarmGatewayInputError}</div>
                    ) : null}
                  </>
                }
              />
              <SettingItem
                title="Swarm Postage Stamp ID"
                component={<></>}
                children={
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]:
                          // (
                          swarmPostageStampIdInputError,
                        //  &&
                        // !isValidPostageStampId(swarmPostageStampIdInput)) ||
                        // swarmPostageStampIdInputError,
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={() => {
                          // setSwarmPostageStampIdInputError(null)
                          if (!isValidPostageStampId(swarmPostageStampIdInput)) {
                            getDefaultValueSwarmPostageStampId(swarmPostageStampIdInput)
                            setSwarmPostageStampIdInputError(null)
                          }
                          if (swarmPostageStampIdInput.length === 0) {
                            setSwarmPostageStampIdInputError(null)
                            getDefaultValueSwarmPostageStampId(swarmPostageStampIdInput)
                          }
                        }}
                        onFocus={() => {
                          setSwarmPostageStampIdInput('')
                          setSwarmPostageStampIdInputError(null)
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (isValidPostageStampId(swarmPostageStampIdInput)) {
                            setSwarmPostageStampId(swarmPostageStampIdInput)
                          } else if (!isValidPostageStampId(swarmPostageStampIdInput)) {
                            setSwarmPostageStampIdInputError('Enter valid Swarm Postage Stamp ID')
                            getDefaultValueSwarmPostageStampId(swarmPostageStampIdInput)
                            setTimeout(() => {
                              setSwarmPostageStampIdInputError(null)
                            }, 3000)
                          }
                          // onPress(e, inputOfFocusSwarmId)
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={swarmPostageStampIdInput}
                          ref={inputOfFocusSwarmId}
                          onChange={(e) => {
                            setSwarmPostageStampIdInput(e.target.value)
                            setSwarmPostageStampIdInputError(null)
                            setSwarmPostageStampIdInputEdited(true)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          getDefaultValueSwarmPostageStampId(swarmPostageStampIdInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {swarmPostageStampIdInputError ? (
                      <div className={styles.errorMessage}>{swarmPostageStampIdInputError}</div>
                    ) : null}
                  </>
                }
              />
              <SettingItem
                title="IPFS Gateway"
                component={<></>}
                children={
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]:
                          (!!ipfsGatewayInputError && !isValidHttp(ipfsGatewayInput)) ||
                          ipfsGatewayInputError,
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={() => {
                          setIpfsGatewayInputError(null)
                          if (!isValidHttp(ipfsGatewayInput)) {
                            getDefaultValueIpfsGateway(ipfsGatewayInput)
                          }
                          if (ipfsGatewayInput.length === 0) {
                            getDefaultValueIpfsGateway(ipfsGatewayInput)
                          }
                        }}
                        onFocus={() => {
                          setIpfsGatewayInput('')
                          setIpfsGatewayInputError(null)
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()
                          setIpfsGateway(ipfsGatewayInput)
                          onPress(e, inputOfFocusIPFS)
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={ipfsGatewayInput}
                          ref={inputOfFocusIPFS}
                          onChange={(e) => {
                            setIpfsGatewayInput(e.target.value)
                            setIpfsGatewayEdited(true)
                            setIpfsGatewayInputError(null)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()

                          getDefaultValueIpfsGateway(ipfsGatewayInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {ipfsGatewayInputError ? (
                      <div className={styles.errorMessage}>{ipfsGatewayInputError}</div>
                    ) : null}
                  </>
                }
              />
              <SettingItem
                title="SIA Portal"
                component={<></>}
                children={
                  <>
                    <div
                      className={cn(styles.formDefault, styles.formAbsolute, {
                        [styles.errorInputDefault]:
                          (!!siaPortalInputError && !isValidHttp(siaPortalInput)) ||
                          siaPortalInputError,
                      })}
                    >
                      <form
                        style={{ width: '100%' }}
                        onBlur={(e) => {
                          setSiaPortalInputError(null)

                          if (!isValidHttp(siaPortalInput)) {
                            getDefaultValueSiaPortal(siaPortalInput)
                          }
                          if (siaPortalInput.length === 0) {
                            getDefaultValueSiaPortal(siaPortalInput)
                          }
                        }}
                        onFocus={() => {
                          setSiaPortalInput('')
                          setSiaPortalInputError(null)
                        }}
                        onSubmit={(e) => {
                          e.preventDefault()

                          setSiaPortal(siaPortalInput)
                          onPress(e, inputOfFocusSia)
                        }}
                      >
                        <input
                          className={cn(styles.inputDefault, {})}
                          value={siaPortalInput}
                          ref={inputOfFocusSia}
                          onChange={(e) => {
                            setSiaPortalInput(e.target.value)
                            setSiaPortalEdited(true)
                            setSiaPortalInputError(null)
                          }}
                        />
                      </form>
                      <button
                        onClick={(e) => {
                          e.preventDefault()

                          getDefaultValueSiaPortal(siaPortalInput)
                        }}
                        className={cn(styles.buttonInputDefault, styles.btnAbsolute)}
                      />
                    </div>
                    {siaPortalInputError ? (
                      <div className={styles.errorMessage}>{siaPortalInputError}</div>
                    ) : null}
                  </>
                }
              />
            </>
          }
        />
      </div>
    </div>
  )
}
