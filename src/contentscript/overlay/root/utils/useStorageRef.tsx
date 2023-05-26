import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useQuery } from 'react-query'
import browser from 'webextension-polyfill'
import { StorageRef } from '../../../../common/types'

export const useStorageRef = (storageRef: StorageRef | string) => {
  return useQuery({
    queryKey: ['storageref', storageRef],
    queryFn: () => _getBase64ByStorageRef(storageRef),
  })
}

async function _getBase64ByStorageRef(storageRef: StorageRef | string): Promise<string | null> {
  if (!storageRef) return null

  if (typeof storageRef === 'string') {
    return storageRef
  } else {
    const { hash, uris } = storageRef

    if (!hash && uris.length > 0 && uris[0].indexOf('data:') === 0) {
      return uris[0]
    } else {
      const { getResource } = await initBGFunctions(browser)

      if (
        storageRef.hash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ||
        storageRef.uris.length !== 0
      ) {
        const base64 = await getResource(storageRef)
        const dataUri = 'data:text/plain;base64,' + base64

        return dataUri
      } else {
        return null
      }
    }
  }
}
