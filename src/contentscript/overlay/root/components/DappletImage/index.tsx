import cn from 'classnames'
import React, { FC, useEffect } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'
import styles from './DappletImage.module.scss'
import useAbortController from '../../hooks/useAbortController'

export interface DappletImageProps {
  storageRef: StorageRef
  isFavourites: boolean
  className?:string
}

export const DappletImage: FC<DappletImageProps> = (props: DappletImageProps) => {
  const { storageRef, isFavourites,className } = props
  const { img } = useStorageRef(storageRef)
  const abortController = useAbortController();
  useEffect(() => {
  }, [abortController.signal.aborted,img])
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
        {/* <span
					className={cn(styles.label, {
						[styles.true]: isFavourites,
						[styles.false]: !isFavourites,
					})}
				>
					<Star />
				</span> */}
      </div>
    </div>
  )
}
