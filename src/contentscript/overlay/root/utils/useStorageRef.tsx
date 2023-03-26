import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import NO_LOGO from '../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../common/types'

export const useStorageRef = (storageRef: StorageRef) => {
  const [img, setImg] = useState<string>('')

  useEffect(() => {
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
    init()
    return () => {}
  }, [])

  return { img }
}
