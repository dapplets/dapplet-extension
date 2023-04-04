import cn from 'classnames'
import React, { FC } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'
import styles from './DappletImage.module.scss'

export interface DappletImageProps {
  storageRef: StorageRef
  className?: string
}

export const DappletImage: FC<DappletImageProps> = (props: DappletImageProps) => {
  const { storageRef, className } = props
  const { data } = useStorageRef(storageRef)

  return (
    <div className={cn(styles.icon)}>
      <div className={cn(styles.img, className)}>
        <img src={data ? data : NO_LOGO} />
      </div>
    </div>
  )
}
