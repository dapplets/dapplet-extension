import cn from 'classnames'
import React, { FC } from 'react'
import styles from './Skip.module.scss'

export type SkipProps = {
  onSkip?: (x) => void
}

export const Skip: FC<SkipProps> = (props: SkipProps) => {
  const { onSkip } = props

  return (
    <button onClick={onSkip} className={cn(styles.skip)}>
      Skip tutorial
    </button>
  )
}
