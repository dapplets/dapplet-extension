import cn from 'classnames'
import React, { FC } from 'react'
import styles from './SkipButton.module.scss'

export type Props = {
  onClick: () => void
}

export const SkipButton: FC<Props> = (props: Props) => {
  const { onClick } = props

  return (
    <button data-testid="skip-tutorial" onClick={onClick} className={cn(styles.skip)}>
      Skip tutorial
    </button>
  )
}
