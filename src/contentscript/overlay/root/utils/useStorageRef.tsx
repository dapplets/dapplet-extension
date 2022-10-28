import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import NO_LOGO from '../../../../common/resources/no-logo.png'
import { StorageRef } from '../../../../common/types'
import useAbortController from '../hooks/useAbortController'

export const useStorageRef = (storageRef: StorageRef) => {
  const [img, setImg] = useState<string>('')
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      try {
        const { getResource } = await initBGFunctions(browser)
        const base64 = await getResource(storageRef)
        const dataUri = 'data:text/plain;base64,' + base64
        if (!abortController.signal.aborted) {
          setImg(dataUri)
        }
      } catch (error) {
        setImg(NO_LOGO)
      }
    }
    init()
    return () => {
      abortController.abort()
    }
  }, [abortController.signal.aborted])

  return { img }
}
