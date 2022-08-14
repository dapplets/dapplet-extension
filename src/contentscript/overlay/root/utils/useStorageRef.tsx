import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { StorageRef } from '../../../../background/registries/registry'
import NO_LOGO from '../../../../common/resources/no-logo.png'

export const useStorageRef = (storageRef: StorageRef) => {
  const [img, setImg] = useState<string>('')
  const _isMounted = useRef(true)
  useEffect(() => {
    const init = async () => {
      if (_isMounted.current) {
        try {
          const { getResource } = await initBGFunctions(browser)
          const base64 = await getResource(storageRef)
          const dataUri = 'data:text/plain;base64,' + base64
          setImg(dataUri)
        } catch (error) {
          setImg(NO_LOGO)
        }
      }
    }
    init()
    return () => {
      _isMounted.current = false
    }
  }, [])

  return { img }
}
