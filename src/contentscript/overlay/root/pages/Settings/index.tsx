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
import { SettingsList } from './Settings'
import { MainList } from './Main'

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

let _isMounted = false
export const SettingsOverlay = () => {
  const [activeTab, setActiveTab] = useState(SettingsTabs.SETTINGS)

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
  <MainList/>
        )} */}
        {activeTab === SettingsTabs.SETTINGS && <SettingsList />}

        {activeTab === SettingsTabs.DEVELOPER && <Developer />}
      </div>
    </div>
  )
}

// https://goerli.mooo.com/
// 0x141442f8DC04E962478404ba6704fDDDE531D60e
