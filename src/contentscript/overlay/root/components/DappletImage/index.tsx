import cn from 'classnames'
import React, { FC, useEffect } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'
import styles from './DappletImage.module.scss'
export interface DappletImageProps {
  storageRef: StorageRef
  isFavourites: boolean
  className?: string
}

export const DappletImage: FC<DappletImageProps> = (props: DappletImageProps) => {
  const { storageRef, isFavourites, className } = props
  const { img } = useStorageRef(storageRef)

  useEffect(() => {}, [])
  return (
    <div className={cn(styles.icon)}>
      <div className={cn(styles.img, className)}>
        <img
          src={img ? img : NO_LOGO}
          alt=" "
          onError={({ currentTarget }) => {
            currentTarget.onerror = null
            currentTarget.src = NO_LOGO
          }}
        />
      </div>
    </div>
  )
}
