import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useState,
  ChangeEventHandler,
  useEffect,
} from 'react'
import cn from 'classnames'
import styles from './Settings.module.scss'
import { SettingTitle } from '../../components/SettingTitle'
import { SettingItem } from '../../components/SettingItem'
import { Switch } from '../../components/Switch'
import { Dropdown } from '../../components/Dropdown'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Checkbox } from '../../components/Checkbox'
import { InputPanel } from '../../components/InputPanel'
// import { CheckboxList } from '../Notifications'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { trimUriPrefix } from 'skynet-js/dist/cjs/utils/string'

enum SettingsTabs {
  MAIN = 0,
  ADVANCED = 1,
  DEVELOPER = 2,
}

export const NAVIGATION_LIST = [
  { _id: '0', title: 'Main' },
  { _id: '1', title: 'Advanced' },
  { _id: '2', title: 'Developer' },
]

export const DROPDOWN_LIST = [
  { _id: '0', label: 'Vertion name' },
  { _id: '1', label: 'Vertion name' },
  { _id: '2', label: 'Vertion name' },
]
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
  const [activeTab, setActiveTab] = useState(SettingsTabs.ADVANCED)

  // useEffect(() => {
  //   _isMounted = true
  //   // const init = async () => {

  //   //   console.log(isUpdateAvailable)
  //   // }
  //   // init()
  //   checkUpdates()
  //   return () => {
  //     _isMounted = false
  //   }
  // }, [])

  // const checkUpdates = async () => {
  //   const { getNewExtensionVersion } = await initBGFunctions(browser)
  //   const isUpdateAvailable = !!(await getNewExtensionVersion())
  //   onUpdateAvailable(isUpdateAvailable)
  // }
  console.log(activeTab)
  const handleActiveTab = () => {
    setActiveTab(SettingsTabs.MAIN)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        <SettingTitle
          title="Main"
          onClick={() => setActiveTab(SettingsTabs.MAIN)}
          isActive={activeTab === SettingsTabs.MAIN}
        />
        <SettingTitle
          title="Advanced"
          onClick={() => setActiveTab(SettingsTabs.ADVANCED)}
          isActive={activeTab === SettingsTabs.ADVANCED}
        />
        <SettingTitle
          title="Developer"
          onClick={() => setActiveTab(SettingsTabs.DEVELOPER)}
          isActive={activeTab === SettingsTabs.DEVELOPER}
        />
      </div>

      <div className={styles.settingMain}>
        {activeTab === SettingsTabs.MAIN && (
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
        )}
        {activeTab === SettingsTabs.ADVANCED && (
          <>
            {' '}
            <SettingWrapper
              title="Profile"
              // children={

              // }
            />
            <SettingWrapper
              title="Version"
              // children={

              // }
            />
            <SettingWrapper
              title="Trusted Users"
              // children={

              // }
            />
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
                      <InputPanel placeholder="dynamic-adapter.dapplet-base.eth#default@..." />
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
                      <InputPanel placeholder="http:\\bee.dapplets.org\" />
                    }
                  />
                  <SettingItem
                    title="Swarm Postage Stamp ID"
                    component={<Dropdown list={DROPDOWN_LIST} />}
                    children={
                      <InputPanel placeholder="Swarm Postage Stamp ID" />
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
                    <InputPanel placeholder="eda881d858ae4a25b2dfbbd0b4629992" />
                  }
                />
              }
            />
          </>
        )}
      </div>
    </div>
  )
}
