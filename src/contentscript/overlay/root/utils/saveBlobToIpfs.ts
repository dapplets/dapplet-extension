import { ERROR_MESSAGES, IPFS_GATEWAY } from '../constants'

const saveBlobToIpfs = async (data: Blob) => {
  const response = await fetch(`${IPFS_GATEWAY}/ipfs/`, {
    method: 'POST',
    body: data,
  })

  if (!response.ok) {
    const error = await response
      .json()
      .then((x) => `${x.code} ${x.message}`)
      .catch(() => `${response.status} ${response.statusText}`)

    throw new Error(error)
  }

  const cid = response.headers.get('ipfs-hash')

  if (!cid) throw new Error(ERROR_MESSAGES.IPFS_UPLOAD_FAIL)
  const url = 'ipfs://' + cid
  return url
}

export default saveBlobToIpfs
