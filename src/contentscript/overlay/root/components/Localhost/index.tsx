import React, { ChangeEvent, FC } from 'react'
import { HTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './Localhost.module.scss'
import { on } from '../../../../../common/global-event-bus'
import { useToggle } from '../../hooks/useToggle'

export interface LocalhostProps {
  isEnabled: false
  error: string
  closeHost: () => void
  onClickButtonLocalhost: () => void
  onModuleInfo: () => void
  // onClickLabelLocalhost: () => void
  label: any
  moduleTitle: string
  moduleType: string
  moduleBranch: string
  moduleVersion: string
  // imgDapplet: string
}

export const Localhost: FC<LocalhostProps> = (props) => {
  const {
    isEnabled,
    error,
    closeHost,
    onClickButtonLocalhost,
    // imgDapplet,
    // onClickLabelLocalhost,
    label,
    moduleTitle,
    moduleType,
    onModuleInfo,
    moduleVersion,
    moduleBranch,
  } = props
  const [isShowDescription, onShowDescription] = useToggle(false)
  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
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
        <label
          onClick={() => {
            onModuleInfo()
            onShowDescription()
          }}
          className={styles.labelLocalhost}
        >
          {label}
        </label>
        <button className={styles.closeLocalhost} onClick={closeHost} />
      </div>
      {isShowDescription && (
        <div className={styles.dappletsBlock}>
          <div className={styles.dappletsImg}>{/* <img src="" /> */}</div>
          <div className={styles.dappletsInfo}>
            <div className={styles.dappletsTegs}>
              <div className={styles.dappletsVersion}>{moduleVersion}</div>
              <div className={styles.dappletsBranch}>{moduleBranch}</div>
            </div>

            <div className={styles.blockInfo}>
              <h3 className={styles.dappletsTitle}>{moduleTitle}</h3>
              <button className={styles.dappletsSettings} />
              <button className={styles.dappletsReupload}>Reupload </button>
            </div>
            <div className={styles.dappletsLabel}>
              <div>
                <span className={styles.dappletsLabelSpan}>ID:</span>
                <label className={styles.dappletsLabelSpan}>rnhgrs.eth</label>
              </div>
              <div>
                <span className={styles.dappletsLabelSpan}>Ownership:</span>
                <label className={styles.dappletsLabelSpan}>
                  0xB6fa...B8ad
                </label>
              </div>
              <div>
                <span className={styles.dappletsLabelSpan}>Regestry:</span>
                <label className={styles.dappletsLabelSpan}>
                  0xB6fa...B8ad
                </label>
              </div>
              <div>
                <span className={styles.dappletsLabelSpan}>
                  Version in registry:
                </span>
                <label className={styles.dappletsLabelSpan}>
                  0xB6fa...B8ad
                </label>
              </div>
              <div>
                <span className={styles.dappletsLabelSpan}>Type:</span>
                <label className={styles.dappletsLabelSpan}>{moduleType}</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
