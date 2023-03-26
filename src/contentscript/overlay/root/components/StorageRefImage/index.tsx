import cn from 'classnames'
import React, { FC } from 'react'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'
import styles from './StorageRefImage.module.scss'

interface PropsStorageRefImage {
  storageRef: StorageRef | string
  className?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export const StorageRefImage: FC<PropsStorageRefImage> = (props) => {
  const { storageRef, className, onClick } = props

  const { data } = useStorageRef(storageRef)

  return (
    <div className={cn(styles.dappletsImg, className)} onClick={onClick}>
      {data ? <img src={data} /> : <span className={styles.noLogo} />}
    </div>
  )
}
