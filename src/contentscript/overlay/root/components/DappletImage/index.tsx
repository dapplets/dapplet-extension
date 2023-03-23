import cn from 'classnames'
import React, { FC, useEffect } from 'react'
import * as EventBus from '../../../../../common/global-event-bus'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../../common/types'
import useAbortController from '../../hooks/useAbortController'
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
  const abortController = useAbortController()
  useEffect(() => {}, [abortController.signal.aborted])
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
