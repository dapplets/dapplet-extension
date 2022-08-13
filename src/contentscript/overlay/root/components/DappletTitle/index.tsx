import cn from 'classnames'
import React, { FC, ReactChild, ReactNode } from 'react'
import styles from './DappletTitle.module.scss'

export interface DappletTitleProps {
  title: string
  isShowDescription?: boolean
  children?: ReactChild | ReactNode
}
export const DappletTitle: FC<DappletTitleProps> = (props: DappletTitleProps) => {
  const { title, children } = props

  return (
    <div className={cn(styles.BlockTitleCard)}>
      <h2 className={cn(styles.titleCard)}>{title}</h2>

      {children}
    </div>
  )
}
