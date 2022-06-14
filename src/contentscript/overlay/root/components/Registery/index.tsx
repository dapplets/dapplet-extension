import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Registery.module.scss'

export interface RegisteryProps {
  isShowChildrenRegistery?: boolean
  label: string
  setShowChildrenRegistery: (x) => void
}
export const Registry: FC<RegisteryProps> = (props) => {
  const { isShowChildrenRegistery, setShowChildrenRegistery, label, children } = props

  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        <button disabled className={cn(styles.buttonLocalhost, {})}>
          Registry
        </button>
        <label
          onClick={() => {
            setShowChildrenRegistery(!isShowChildrenRegistery)
          }}
          className={styles.labelLocalhost}
        >
          {label}
        </label>
        <span
          onClick={() => {
            setShowChildrenRegistery(!isShowChildrenRegistery)
          }}
          className={cn(styles.spanLabel, {
            [styles.isShowDescriptionLabel]: isShowChildrenRegistery,
          })}
        ></span>
      </div>
      {isShowChildrenRegistery && children}
    </div>
  )
}
