import cn from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import styles from './Registery.module.scss'

export interface RegisteryProps {
  isShowChildrenRegistery?: boolean
  label: string
  setShowChildrenRegistery: (x) => void
}
export const Registry: FC<RegisteryProps> = (props) => {
  const { isShowChildrenRegistery, setShowChildrenRegistery, label, children } = props
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
            setShowChildrenRegistery(!isShowChildrenRegistery)
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
              [styles.isShowDescriptionLabel]: isShowChildrenRegistery,
            })}
          ></span>
        </div>
      </div>
      {isShowChildrenRegistery && children}
    </div>
  )
}
