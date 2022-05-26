import cn from 'classnames'
import React, { FC } from 'react'
import styles from './UnderConstruction.module.scss'

export interface UnderConstructionProps {
  isShowChildren?: boolean
  label: string
  setShowChildrenUnderConstraction: (x) => void
}
export const UnderConstruction: FC<UnderConstructionProps> = (props) => {
  const { setShowChildrenUnderConstraction, isShowChildren, label, children } = props

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
