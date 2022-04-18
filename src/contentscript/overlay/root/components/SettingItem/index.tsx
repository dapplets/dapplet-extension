import React, {
  FC,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
} from 'react'
import cn from 'classnames'
import styles from './SettingItem.module.scss'

export interface SettingItemProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  title: string
  component: ReactElement
  isShowAdditionalSettings?: boolean
  isVisibleAdditionalSettings?: boolean
  onShowAdditionalSettings?: () => void
  // children?: ReactElement
}

export const SettingItem: FC<SettingItemProps> = (props: SettingItemProps) => {
  const {
    title,
    component,
    children = null,
    className,
    isVisibleAdditionalSettings = false,
    isShowAdditionalSettings = false,
    onShowAdditionalSettings,
  } = props

  const isAdditionalSettings = children && isVisibleAdditionalSettings
  const isShowSettings = isShowAdditionalSettings && isVisibleAdditionalSettings

  return (
    <div className={cn(styles.MainSettingsAuto, className)}>
      <div className={styles.header}>
        <h3
          onClick={onShowAdditionalSettings}
          className={cn(styles.title, {
            [styles.additionalSettings]: isAdditionalSettings,
            [styles.isShowAdditionalSettings]: isShowSettings,
          })}
        >
          {title}
        </h3>
        {component}
      </div>
      {children && <div className={styles.children}>{children}</div>}
    </div>
  )
}