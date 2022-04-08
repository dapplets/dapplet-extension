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
// import { CheckboxList } from '../Notifications'

import { Developer } from './Developer'

enum SettingsTabs {
  // MAIN = 0,
  SETTINGS = 0,
  DEVELOPER = 2,
}

export const NAVIGATION_LIST = [
  // { _id: '0', title: 'Main' },
  { _id: '0', title: 'Settings' },
  { _id: '1', title: 'Developer' },
]

export const DROPDOWN_LIST = [{ _id: '0', label: 'Custom' }]
export const CHECKBOX_LIST = [
  {
    id: 0,
    title: 'System',
    isCheckbox: true,
  },
  {
    id: 2,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 3,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 4,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 5,
    title: 'Label',
    isCheckbox: false,
  },
  {
    id: 6,
    title: 'Label',
    isCheckbox: false,
  },
]

export const checkboxList = (): React.ReactElement => (
  <>
    <Checkbox title="System" isCheckbox={true} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
    <Checkbox title="Label" isCheckbox={false} style={{ width: '30%' }} />
  </>
)
let _isMounted = false
export const SettingsOverlay = () => {
  const [isAutoupdateActive, onAutoupdateActive] = useToggle(false)
  const [isNotificationActive, onNotificationActive] = useToggle(false)
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)
  const [activeTab, setActiveTab] = useState(SettingsTabs.SETTINGS)

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

  useEffect(() => {
    _isMounted = true

    loadProvider()
    loadSwarmGateway()
    loadSwarmPostageStampId()
    loadDynamicAdapter()
    return () => {
      _isMounted = false
    }
  }, [])
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

  setProvider(providerInput)
  setSwarmGateway(swarmGatewayInput)
  setSwarmPostageStampId(swarmPostageStampIdInput)
  setDynamicAdapter(dynamicAdapterInput)

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        {/* <SettingTitle
          title="Main"
          onClick={() => setActiveTab(SettingsTabs.MAIN)}
          isActive={activeTab === SettingsTabs.MAIN}
        /> */}
        <SettingTitle
          title="Settings"
          onClick={() => setActiveTab(SettingsTabs.SETTINGS)}
          isActive={activeTab === SettingsTabs.SETTINGS}
        />
        <SettingTitle
          title="Developer"
          onClick={() => setActiveTab(SettingsTabs.DEVELOPER)}
          isActive={activeTab === SettingsTabs.DEVELOPER}
        />
      </div>

      <div className={styles.settingMain}>
        {/* {activeTab === SettingsTabs.MAIN && (
          <>
            <SettingWrapper
              title="Extension settings"
              children={
                <>
                  <SettingItem
                    title="Autoupdate"
                    component={<Switch checked={isUpdateAvailable} />}
                  />
                  <SettingItem
                    title="Notifications"
                    component={
                      <Switch
                        checked={isNotificationActive}
                        onClick={onNotificationActive}
                      />
                    }
                    children={
                      isNotificationActive && (
                        <>
                          {CHECKBOX_LIST.map(({ id, title, isCheckbox }) => (
                            <Checkbox
                              title={title}
                              key={id}
                              isCheckbox={isCheckbox}
                              style={{ width: '30%' }}
                            />
                          ))}
                        </>
                      )
                    }
                    isVisibleAdditionalSettings={isNotificationActive}
                    isShowAdditionalSettings={true}
                  />
                </>
              }
            />
            <SettingWrapper
              title="Dapplets settings"
              children={
                <>
                  <SettingItem
                    title="Autoactivate dapplets"
                    component={<Switch checked={false} />}
                  />
                  <SettingItem
                    title="Autoupdate dapplets"
                    component={<Switch checked={false} />}
                  />
                </>
              }
            />
          </>
        )} */}
        {activeTab === SettingsTabs.SETTINGS && (
          <>
            <SettingWrapper title="Version" />
            <SettingWrapper title="Trusted Users" />
            <SettingWrapper
              title="Core settings"
              children={
                <>
                  <SettingItem
                    title="Registry"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={<InputPanel placeholder="Placeholder" />}
                  />
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
        )}

        {activeTab === SettingsTabs.DEVELOPER && <Developer />}
      </div>
    </div>
  )
}

// https://goerli.mooo.com/
// 0x141442f8DC04E962478404ba6704fDDDE531D60e
