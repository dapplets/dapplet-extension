import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { ReactComponent as Close } from '../../assets/icons/close.svg'
import { ReactComponent as Up } from '../../assets/icons/up.svg'
import { useToggle } from '../../hooks/useToggle'
import styles from './Localhost.module.scss'
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
  const [isShowDescription, onShowDescription] = useToggle(true)
  const [isHeightLabel, onHeightLabel] = useState(false)
  const nodeBtn = useRef<HTMLButtonElement>()
  const nodeLabelBlock = useRef<HTMLDivElement>()

  useEffect(() => {
    const height = nodeLabelBlock.current.getBoundingClientRect().height
    if (height > 22) {
      onHeightLabel(true)
    }
  }, [])

  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        <button
          ref={nodeBtn}
          onClick={(e) => {
            onClickButtonLocalhost()
            if (e && !isEnabled && !error) {
              nodeBtn.current.classList.add(styles.disabledLoad)
            } else if (e && isEnabled && error) {
              nodeBtn.current.classList.add(styles.errorLoad)
            } else if (e && isEnabled && !error) {
              nodeBtn.current.classList.add(styles.enabledLoad)
            }
          }}
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

        <div
          ref={nodeLabelBlock}
          className={styles.labelLocalhost}
          onClick={() => {
            onShowDescription()
          }}
        >
          <a
            onClick={() => window.open(label, '_blank')}
            className={cn(styles.label, {
              [styles.bigLabel]: isHeightLabel,
            })}
          >
            {label}
          </a>
          {isEnabled && !error && (
            <span
              className={cn(styles.spanLabel, {
                [styles.isShowDescriptionLabel]: isShowDescription,
              })}
            >
              <Up />
            </span>
          )}
        </div>
        <button className={styles.closeLocalhost} onClick={closeHost}>
          <Close />
        </button>
      </div>
      {isShowDescription && isEnabled && !error && children}
    </div>
  )
}
