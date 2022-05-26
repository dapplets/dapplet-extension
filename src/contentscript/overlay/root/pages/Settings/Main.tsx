import React, { useState } from 'react'
import { Checkbox } from '../../components/Checkbox'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Switch } from '../../components/Switch'
import { useToggle } from '../../hooks/useToggle'

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

export const MainList = () => {
  const [isAutoupdateActive, onAutoupdateActive] = useToggle(false)
  const [isNotificationActive, onNotificationActive] = useToggle(false)
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)
  return (
    <>
      <SettingWrapper
        title="Extension settings"
        children={
          <>
            <SettingItem title="Autoupdate" component={<Switch checked={isUpdateAvailable} />} />
            <SettingItem
              title="Notifications"
              component={<Switch checked={isNotificationActive} onClick={onNotificationActive} />}
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
            <SettingItem title="Autoactivate dapplets" component={<Switch checked={false} />} />
            <SettingItem title="Autoupdate dapplets" component={<Switch checked={false} />} />
          </>
        }
      />
    </>
  )
}
