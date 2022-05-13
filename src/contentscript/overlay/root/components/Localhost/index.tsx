import React, { ChangeEvent, FC } from 'react'
import { HTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './Localhost.module.scss'

import { useToggle } from '../../hooks/useToggle'

export interface LocalhostProps {
  isEnabled: false
  error: string
  closeHost: () => void
  onClickButtonLocalhost: () => void
  label: string
  isLoadButtonLocalhost?: boolean
}

export const Localhost: FC<LocalhostProps> = (props) => {
  const {
    isEnabled,
    error,
    closeHost,
    onClickButtonLocalhost,
    label,
    children,
    isLoadButtonLocalhost,
  } = props
  const [isShowDescription, onShowDescription] = useToggle(false)
  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        {isLoadButtonLocalhost ? (
          <div
            className={cn(styles.buttonLocalhostLoad, {
              [styles.disabledLoad]: !isEnabled && !error,
              [styles.errorLoad]: isEnabled && error,
              [styles.enabledLoad]: isEnabled && !error,
            })}
          ></div>
        ) : (
          <button
            onClick={onClickButtonLocalhost}
            className={cn(styles.buttonLocalhost, {
              [styles.disabled]: !isEnabled && !error,
              [styles.error]: isEnabled && error,
              [styles.enabled]: isEnabled && !error,
            })}
          >
            {(!isEnabled && !error && 'Disabled') ||
              (isEnabled && error && 'Error') ||
              (isEnabled && !error && 'Enabled')}
          </button>
        )}

        <label
          onClick={() => {
            onShowDescription()
          }}
          className={styles.labelLocalhost}
        >
          {label}
        </label>
        <button className={styles.closeLocalhost} onClick={closeHost} />
      </div>
      {isShowDescription && isEnabled && !error && children}
    </div>
  )
}
