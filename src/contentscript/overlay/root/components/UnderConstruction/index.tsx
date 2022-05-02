import React, { ChangeEvent, FC, useState } from 'react'
import { HTMLAttributes, DetailedHTMLProps } from 'react'
import cn from 'classnames'
import styles from './UnderConstruction.module.scss'
import { on } from '../../../../../common/global-event-bus'
import { useToggle } from '../../hooks/useToggle'

export interface UnderConstructionProps {
  // isEnabled: false
  // error: string
  // closeHost: () => void
  // onClickButtonLocalhost: () => void
  isShowChildren?: boolean
  label: string
  setShowChildrenUnderConstraction: (x) => void
}
export const UnderConstruction: FC<UnderConstructionProps> = (props) => {
  const {
    // isEnabled,
    // error,
    // closeHost,
    // onClickButtonLocalhost,
    // isShowChildren = isShowDescription,
    setShowChildrenUnderConstraction,
    isShowChildren,
    label,
    children,
  } = props
  // const [isShowDescription, onShowDescription] = useToggle(isShowChildren)

  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        <button disabled className={cn(styles.buttonLocalhost, {})}>
          UC
        </button>
        <label
          onClick={() => {
            setShowChildrenUnderConstraction(!isShowChildren)
          }}
          className={styles.labelLocalhost}
        >
          {label}
        </label>
      </div>
      {isShowChildren && children}
    </div>
  )
}
