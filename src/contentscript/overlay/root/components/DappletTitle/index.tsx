import React, { FC } from 'react'
import cn from 'classnames'
import styles from './DappletTitle.module.scss'
import { ReactComponent as Up } from '../../assets/icons/up-mini.svg'

export interface DappletTitleProps {
  title: string
  isShowDescription: boolean
}
export const DappletTitle: FC<DappletTitleProps> = (
  props: DappletTitleProps
) => {
  const { title, isShowDescription = false } = props

  return (
    <div className={cn(styles.BlockTitleCard)}>
      <h2 className={cn(styles.titleCard)}>{title}</h2>
      {/* <span
				className={cn(styles.iconCard, {
					[styles.isShowDescription]: isShowDescription,
				})}
			>
				<Up />
			</span> */}
    </div>
  )
}
