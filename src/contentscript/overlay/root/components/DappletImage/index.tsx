import cn from 'classnames'
import React, { FC } from 'react'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'
import styles from './DappletImage.module.scss'

export interface DappletImageProps {
  storageRef: StorageRef
  isFavourites: boolean
}

export const DappletImage: FC<DappletImageProps> = (props: DappletImageProps) => {
  const { storageRef, isFavourites } = props
  const { img } = useStorageRef(storageRef)

  return (
    <div className={cn(styles.icon)}>
      <div className={cn(styles.img)}>
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
