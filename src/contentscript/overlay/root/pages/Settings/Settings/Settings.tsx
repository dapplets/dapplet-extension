import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { StorageTypes } from '../../../../../../common/constants'
import { ReactComponent as Delete } from '../../../assets/icons/mini-close.svg'
import { Checkbox } from '../../../components/Checkbox'
import { DropdownPreferedOverlayStorage } from '../../../components/DropdownPreferedOverlayStorage'
import { DropdownPreferredCANetwork } from '../../../components/DropdownPreferredCANetwork'
import { DropdownRegistry } from '../../../components/DropdownRegistry'
import { DropdownTrustedUsers } from '../../../components/DropdownTrustedUsers'
import { InputPanelSettings } from '../../../components/InputPanelSettings'
import { SettingItem } from '../../../components/SettingItem'
import { SettingWrapper } from '../../../components/SettingWrapper'
import { Switch } from '../../../components/Switch'
import { getDefaultValueProvider } from '../../../utils/getDefaultValue'
import styles from './Settings.module.scss'

interface SettingsListProps {
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

  // const [swarmGatewayInput, setSwarmGatewayInput] = useState('')
  // const [swarmGatewayInputError, setSwarmGatewayInputError] = useState(null)
  // const [swarmGatewayInputDefault, setSwarmGatewayInputDefault] = useState('')

  // const [swarmPostageStampIdInput, setSwarmPostageStampIdInput] = useState('')
  // const [swarmPostageStampIdInputError, setSwarmPostageStampIdInputError] = useState(null)
  // const [swarmPostageStampIdInputDefault, setSwarmPostageStampIdInputDefault] = useState('')

  const [userAgentNameInput, setUserAgentNameInput] = useState('')
  const [userAgentNameInputError, setUserAgentNameInputError] = useState(null)

  const [ipfsGatewayInput, setIpfsGatewayInput] = useState('')
  const [ipfsGatewayInputError, setIpfsGatewayInputError] = useState(null)
  const [ipfsGatewayInputDefault, setIpfsGatewayInputDefault] = useState('')

  const [targetStorages, setTargetStorages] = useState([])

  const regExpUserAgentName = new RegExp(/^[a-zA-Z0-9-_.\s]{3,128}$/)
  const regExpUserAgentNameFirstSymbol = new RegExp(/^[a-zA-Z0-9]+$/)
  const inputOfFocusIPFS = useRef<HTMLInputElement>()
  // const inputOfFocusSwarmId = useRef<HTMLInputElement>()
  // const inputOfFocusSwarm = useRef<HTMLInputElement>()
  const inputOfFocusEtn = useRef<HTMLInputElement>()
  const inputOfFocusAgentName = useRef<HTMLInputElement>()

  useEffect(() => {
    const init = async () => {
      await checkUpdates()
      await loadProvider()
      // await loadSwarmGateway()
      await loadErrorReporting()
      // await loadSwarmPostageStampId()
      // await loadUserAgentId()
      await loadUserAgentName()
      await loadIpfsGateway()
      await loadTargetStorages()
    }
    init()
  }, [])

  const getValidUserAgentName = (value, reg) => {
    try {
      const valueReg = value.match(reg)

      return valueReg
    } catch (err) {
      console.log(err)
    }
  }
  const getValidUserAgentNameFirstSymbol = (value, reg) => {
    try {
      const firsSymbolString = value.slice(0, 1)
      const valueReg = firsSymbolString.match(reg)

      return valueReg
    } catch (err) {
      console.log(err)
    }
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

  // const loadSwarmGateway = async () => {
  // const { getInitialConfig } = await initBGFunctions(browser)
  // const config = await getInitialConfig()

  // if (config.swarmGatewayUrl) {
  //   setSwarmGatewayInputDefault(config.swarmGatewayUrl)
  // }
  // const { getSwarmGateway } = await initBGFunctions(browser)
  // const gateway = await getSwarmGateway()

  // setSwarmGatewayInput(gateway)
  // }

  // const setSwarmGateway = async (gateway: string) => {
  //   try {
  //     const { setSwarmGateway } = await initBGFunctions(browser)
  //     await setSwarmGateway(gateway)
  //     loadSwarmGateway()
  //   } catch (err) {
  //     setSwarmGatewayInputError(err.message)
  //     setTimeout(() => {
  //       setSwarmGatewayInputError(null)
  //     }, 3000)
  //   }
  // }

  // const loadSwarmPostageStampId = async () => {
  //   const { getInitialConfig } = await initBGFunctions(browser)
  //   const config = await getInitialConfig()

  //   if (config.swarmPostageStampId) {
  //     setSwarmPostageStampIdInputDefault(config.swarmPostageStampId)
  //   }
  //   const { getSwarmPostageStampId } = await initBGFunctions(browser)
  //   const id = await getSwarmPostageStampId()

  //   setSwarmPostageStampIdInput(id)
  // }

  // const setSwarmPostageStampId = async (id: string) => {
  //   try {
  //     const { setSwarmPostageStampId } = await initBGFunctions(browser)
  //     await setSwarmPostageStampId(id)

  //     loadSwarmPostageStampId()
  //   } catch (err) {
  //     setSwarmPostageStampIdInputError(err.message)

  //     setTimeout(() => {
  //       setSwarmPostageStampIdInputError(null)
  //     }, 3000)
  //   }
  // }

  // const loadUserAgentId = async () => {
  //   const { getUserAgentId } = await initBGFunctions(browser)
  //   const userAgentId = await getUserAgentId()
  // }

  const loadUserAgentName = async () => {
    const { getUserAgentName } = await initBGFunctions(browser)
    const userAgentNameInput = await getUserAgentName()

    setUserAgentNameInput(userAgentNameInput)
  }

  const setUserAgentName = async (userAgentName: string) => {
    if (userAgentName.trim().length === 0) {
      setDeleteUserAgentName()
    } else {
      const valueParseFirstSymbol = getValidUserAgentNameFirstSymbol(
        userAgentNameInput.trimStart(),
        regExpUserAgentNameFirstSymbol
      )
      const valueParse = getValidUserAgentName(userAgentNameInput.trimStart(), regExpUserAgentName)
      if (userAgentName.length > 128 || userAgentName.trimStart().length < 3) {
        setUserAgentNameInputError('Valid name length: 3-128 characters')
        // setTimeout(() => {
        //   setUserAgentNameInputError(null)
        //   setUserAgentNameInput('')
        // }, 3000)
        return
      }
      if (valueParseFirstSymbol === null) {
        setUserAgentNameInputError('Please start with a number or latin')
        // setTimeout(() => {
        //   setUserAgentNameInputError(null)
        //   setUserAgentNameInput('')
        // }, 3000)
        return
      }
      if (valueParse !== null) {
        const { setUserAgentName } = await initBGFunctions(browser)
        await setUserAgentName(userAgentName.trim())
        loadUserAgentName()
      } else {
        setUserAgentNameInputError('Please use numbers, latin or ".", "-", "_"')
        // setTimeout(() => {
        //   setUserAgentNameInputError(null)
        //   setUserAgentNameInput('')
        // }, 3000)
      }
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

  const onPress = (e, ref) => {
    ref.current?.blur()
  }
  const setOnboarding = async () => {
    const { setIsFirstInstallation } = await initBGFunctions(browser)
    await setIsFirstInstallation(true)
  }

  const setDeleteUserAgentName = async () => {
    const { setUserAgentName } = await initBGFunctions(browser)
    await setUserAgentName('')
    loadUserAgentName()
  }

  return (
    <div className={styles.blockSettings}>
      <div className={styles.scrollBlock}>
        <SettingWrapper className={styles.wrapperSettings} title="Social">
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
            title="Onboarding"
            component={
              <button className={styles.versionButton} onClick={setOnboarding}>
                Go
              </button>
            }
          />
          <SettingItem title="Trusted Users" component={<></>}>
            <DropdownTrustedUsers />
          </SettingItem>

          <SettingItem
            title="Developer mode"
            component={
              <div className={styles.loaderOrSwitchContainer}>
                {isSvgLoaderDevMode ? (
                  <div className={styles.loader}></div>
                ) : (
                  <Switch checked={devModeProps} onChange={() => setDevMode(!devModeProps)} />
                )}
              </div>
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
          <SettingItem title="User Agent Name" component={<></>}>
            <form
              onBlur={() => {
                userAgentNameInputError ? setUserAgentNameInputError(null) : null
              }}
              onSubmit={(e) => {
                e.preventDefault()

                setUserAgentName(userAgentNameInput)
                onPress(e, inputOfFocusAgentName)
              }}
              className={cn(styles.formDefault, {
                [styles.errorInputDefault]: userAgentNameInputError,
              })}
            >
              <input
                spellCheck={false}
                className={cn(styles.inputDefault, {})}
                placeholder={userAgentNameInput}
                ref={inputOfFocusAgentName}
                value={userAgentNameInput}
                onFocus={() => {
                  userAgentNameInputError ? setUserAgentNameInputError(null) : null
                }}
                onChange={(e) => {
                  setUserAgentNameInput(e.target.value)
                  setUserAgentNameInputError(null)
                }}
              />
              {userAgentNameInput && (
                <Delete
                  onClick={() => setDeleteUserAgentName()}
                  className={styles.deleteUserAgentName}
                />
              )}
            </form>
            {userAgentNameInputError ? (
              <div className={styles.errorMessage}>{userAgentNameInputError}</div>
            ) : null}
          </SettingItem>
        </SettingWrapper>

        <SettingWrapper className={styles.wrapperSettings} title="Parameters">
          <SettingItem title="Registries" component={<></>}>
            <DropdownRegistry />
          </SettingItem>
          <SettingItem title="Prefered Overlay Storage" component={<></>}>
            <DropdownPreferedOverlayStorage />
          </SettingItem>
          <SettingItem title="Storages" component={<></>}>
            <div className={styles.checkboxBlock}>
              <Checkbox disabled isSupport isReadonly isCheckbox title="Centralized" />

              <Checkbox
                isCheckbox={targetStorages?.includes(StorageTypes.Ipfs)}
                title="IPFS"
                onChange={(e) => {
                  changeTargetStorage(StorageTypes.Ipfs, e.target.checked)
                }}
              />
              {/* todo: hidden or the time being */}
              {/* <Checkbox
                title="Swarm"
                isCheckbox={targetStorages?.includes(StorageTypes.Swarm)}
                onChange={(e) => {
                  changeTargetStorage(StorageTypes.Swarm, e.target.checked)
                }}
              /> */}
            </div>
          </SettingItem>
          <SettingItem title="Preferred Connected Accounts Network" component={<></>}>
            <DropdownPreferredCANetwork />
          </SettingItem>
        </SettingWrapper>
        <SettingWrapper title="Providers">
          <SettingItem title="Ethereum Provider" component={<></>}>
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
          </SettingItem>
          {/* todo: hidden or the time being */}
          {/* <SettingItem title="Swarm Gateway" component={<></>}>
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
          </SettingItem> 
          <SettingItem title="Swarm Postage Stamp ID" component={<></>}>
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
              loadProvider={loadSwarmPostageStampId}
              // onPress={onPress}
            />
          </SettingItem> */}
          <SettingItem title="IPFS Gateway" component={<></>}>
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
          </SettingItem>
        </SettingWrapper>
      </div>
    </div>
  )
}
