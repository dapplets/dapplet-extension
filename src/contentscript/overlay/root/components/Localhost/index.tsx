import React, { ChangeEvent, FC, useRef } from 'react'
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
  setLoadButtonLocalhost?: (x) => void
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
    setLoadButtonLocalhost,
  } = props
  const [isShowDescription, onShowDescription] = useToggle(false)
  const nodeBtn = useRef<HTMLButtonElement>()
  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        {/* {isLoadButtonLocalhost ? (
          <div
            className={cn(styles.buttonLocalhostLoad, {
              [styles.disabledLoad]: !isEnabled && !error,
              [styles.errorLoad]: isEnabled && error,
              [styles.enabledLoad]: isEnabled && !error,
            })}
          ></div>
        ) : ( */}
        <button
          ref={nodeBtn}
          onClick={(e) => {
            onClickButtonLocalhost()
            if (e) {
              setLoadButtonLocalhost(true)
            }

            console.log(e)
            console.log(nodeBtn)
          }}
          className={cn(styles.buttonLocalhost, {
            [styles.disabled]: !isEnabled && !error,
            [styles.error]: isEnabled && error,
            [styles.enabled]: isEnabled && !error,

            [styles.disabledLoad]:
              !isEnabled && !error && isLoadButtonLocalhost,
          })}
        >
          {(!isEnabled && !error && 'Disabled') ||
            (isEnabled && error && 'Error') ||
            (isEnabled && !error && 'Enabled')}
        </button>
        {/* )} */}

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
