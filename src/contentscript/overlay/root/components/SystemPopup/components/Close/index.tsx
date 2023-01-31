import cn from 'classnames'
import React, { FC } from 'react'
import { ReactComponent as CloseModal } from '../../../../assets/svg/modalClose.svg'
import styles from './Close.module.scss'
import { CloseProps } from './Close.props'

export const Close: FC<CloseProps> = ({ className, ...props }: CloseProps) => {
  return (
    <button className={cn(styles.close, className)} {...props}>
      {/* <img src={Icon} /> */}
      <CloseModal />
    </button>
  )
}
