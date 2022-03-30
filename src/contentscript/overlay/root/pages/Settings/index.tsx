import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
} from 'react'
import cn from 'classnames'
import styles from './Settings.module.scss'
import { SettingTitle } from '../../components/SettingTitle'
import { SettingItem } from '../../components/SettingItem'
import { Switch } from '../../components/Switch'
import { Dropdown } from '../../components/Dropdown'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Checkbox, checkboxList } from '../../components/Checkbox'

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

export const Settings = () => {
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
                title="Autoactivate dapplets"
                component={<Switch checked={false} />}
              />
              <SettingItem
                title="Notifications"
                component={<Switch checked={true} children={checkboxList()} />}
                isVisibleAdditionalSettings={true}
                isShowAdditionalSettings={true}
              />
            </>
          }
        />
      </div>
    </div>
  )
}
