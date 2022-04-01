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
// import { CheckboxList } from '../Notifications'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { trimUriPrefix } from 'skynet-js/dist/cjs/utils/string'

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

  // useEffect(() => {
  //   _isMounted = true
  //   const init = async () => {
  //     const { getNewExtensionVersion } = await initBGFunctions(browser)
  //     const isUpdateAvailable = !!(await getNewExtensionVersion())
  //     onUpdateAvailable(isUpdateAvailable)
  //     console.log(isUpdateAvailable)
  //   }
  //   init()

  //   return () => {
  //     _isMounted = false
  //   }
  // }, [])

  // const checkUpdates = async () => {

  //   console.log(isUpdateAvailable)
  // }

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        {NAVIGATION_LIST.map(({ _id, title }) => (
          <SettingTitle
            key={_id}
            title={title}
            // style={{ marginRight: 50 }}
            isActive={title === 'Main'}
          />
        ))}
      </div>
      <div className={styles.settingMain}>
        <SettingWrapper
          title="App settings"
          children={
            <>
              <SettingItem
                title="Autoupdate"
                component={
                  <Switch
                    checked={isAutoupdateActive}
                    onClick={onAutoupdateActive}
                  />
                }
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
      </div>
    </div>
  )
}
