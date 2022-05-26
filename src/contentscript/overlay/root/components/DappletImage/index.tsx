import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageRef } from '../../../../../background/registries/registry'
import NO_LOGO from '../../../../../common/resources/no-logo.png'
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
        <img src={img} alt="" />
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

const useStorageRef = (storageRef: StorageRef) => {
  const [img, setImg] = useState<string>('')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const { getResource } = await initBGFunctions(browser)
      const base64 = await getResource(storageRef)
      const dataUri = 'data:text/plain;base64,' + base64
      setImg(dataUri)
    } catch (error) {
      setImg(NO_LOGO)
    }
  }

  return { img }
}
