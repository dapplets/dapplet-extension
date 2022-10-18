import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageRef } from '../../../../../common/types'
import useAbortController from '../../hooks/useAbortController'
import styles from './StorageRefImage.module.scss'

interface PropsStorageRefImage {
  storageRef: StorageRef | string
  className?: string
  onClick?: (x) => void
  title?: string
}

export const StorageRefImage: FC<PropsStorageRefImage> = (props) => {
  const { storageRef, className, title, onClick } = props
  const [dataUri, setDataUri] = useState(null)
  const abortController = useAbortController()

  useEffect(() => {
    const init = async () => {
      await _updateStorageRef(storageRef)
    }
    init()
    return () => {}
  }, [storageRef])
  const _updateStorageRef = async (storageRef) => {
    if (!storageRef) return

    if (typeof storageRef === 'string') {
      setDataUri(storageRef)
    } else {
      const { hash, uris } = storageRef

      if (
        !hash &&
        uris.length > 0 &&
        uris[0].indexOf('data:') === 0 &&
        !abortController.signal.aborted
      ) {
        setDataUri(uris[0])
      } else {
        const { getResource } = await initBGFunctions(browser)

        if (
         ( storageRef.hash !==
            '0x0000000000000000000000000000000000000000000000000000000000000000' ||
          (storageRef.uris.length !== 0 )&& !abortController.signal.aborted)
        ) {
          const base64 = await getResource(storageRef)
          const dataUri = 'data:text/plain;base64,' + base64
          setDataUri(dataUri)
        } else {
          setDataUri(null)
        }
      }
    }
  }
  return (
    <div className={cn(styles.dappletsImg, className)} onClick={onClick}>
      {dataUri ? <img src={dataUri} /> : <span className={styles.noLogo} />}
    </div>
  )
}
