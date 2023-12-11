import cn from 'classnames'
import React, { FC, ReactChild, ReactNode } from 'react'
import styles from './DappletTitle.module.scss'

export interface DappletTitleProps {
  title: string
  isShowDescription?: boolean
  children?: ReactChild | ReactNode
  className?
}
export const DappletTitle: FC<DappletTitleProps> = (props: DappletTitleProps) => {
  const { title, children, className } = props

  return (
    <div className={cn(styles.BlockTitleCard)} data-testid="dapplet-title">
      <div>
        <h2 className={cn(styles.titleCard, className)}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
