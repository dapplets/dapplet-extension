import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import styles from './Registry.module.scss'
import { ReactComponent as Up } from '../../assets/icons/up.svg'
export interface RegistryProps {
  isShowChildrenRegistry?: boolean
  label: string
  setShowChildrenRegistry: (x) => void
}
export const Registry: FC<RegistryProps> = (props) => {
  const { isShowChildrenRegistry, setShowChildrenRegistry, label, children } = props
  const [isHeightLabel, onHeightLabel] = useState(false)

  const nodeLabelBlock = useRef<HTMLDivElement>()
  useEffect(() => {
    const height = nodeLabelBlock.current.getBoundingClientRect().height
    if (height > 22) {
      onHeightLabel(true)
    }
  }, [nodeLabelBlock])

  return (
    <div className={styles.localhost}>
      <div className={styles.hostBlock}>
        <button disabled className={cn(styles.buttonLocalhost, {})}>
          Registry
        </button>
        <div
          ref={nodeLabelBlock}
          className={styles.labelLocalhost}
          onClick={() => {
            setShowChildrenRegistry(!isShowChildrenRegistry)
          }}
        >
          <label
            className={cn(styles.label, {
              [styles.bigLabel]: isHeightLabel,
            })}
          >
            {label}
          </label>

          <span
            className={cn(styles.spanLabel, {
              [styles.isShowDescriptionLabel]: isShowChildrenRegistry,
            })}
          ><Up/></span>
        </div>
      </div>
      {isShowChildrenRegistry && children}
    </div>
  )
}
