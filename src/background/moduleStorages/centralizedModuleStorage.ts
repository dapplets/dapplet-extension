import { ethers } from 'ethers'
import { timeoutPromise } from '../../common/helpers'
import { DirectoryData, Storage as ModuleStorage } from './storage'

type PresignedPost = { [key: string]: string }
type PresignResponse = {
  postURL: string
  formData: PresignedPost
}

export class CentralizedModuleStorage implements ModuleStorage {
  public timeout = 60000
  private _s3ReadEndpoint = 'https://dapplet-api.s3.nl-ams.scw.cloud/'
  private _authEndpoint = 'https://dapplet-api.herokuapp.com/s3/presign'

  public async getResource(
    hash: string,
    fetchController: AbortController = new AbortController()
  ): Promise<ArrayBuffer> {
    const response = await timeoutPromise(
      this.timeout,
      fetch(this._s3ReadEndpoint + hash, { signal: fetchController.signal }),
      () => fetchController.abort()
    )

    if (!response.ok) {
      throw new Error(`CentralizedModuleStorage can't load resource by hash: ${hash}`)
    }

    const buffer = await response.arrayBuffer()

    return buffer
  }

  public async save(blob: Blob) {
    const buffer = await (blob as any).arrayBuffer()
    const hash = ethers.utils.keccak256(new Uint8Array(buffer)).replace('0x', '')

    let presignResponse: PresignResponse = null
    try {
      presignResponse = await this._createPresignedPost(hash)
    } catch (err) {
      if (err.message.indexOf('Item with such ID already exists') !== -1) {
        console.log(`Object "${hash}" already exists in centralized storage. Skipping uploading...`)
        return hash
      } else {
        throw err
      }
    }

    await this._createObject(blob, presignResponse, hash)
    return hash
  }

  async saveDir(data: DirectoryData): Promise<string> {
    const hash = data.hash.replace('0x', '')
    const presignResponse = await this._createPresignedPost(hash)
    await Promise.all(
      data.files.map((x) =>
        this._createObject(new Blob([x.arr]), presignResponse, hash + '/' + x.url)
      )
    )
    return data.hash
  }

  private async _createPresignedPost(id: string): Promise<PresignResponse> {
    const body = JSON.stringify({ id })
    const response = await fetch(this._authEndpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

    const json = await response.json()
    if (!json.success)
      throw new Error(json.message || 'Cannot create presigned post for S3 storage')
    return json.data
  }

  private async _createObject(blob: Blob, presignResponse: PresignResponse, key: string) {
    const form = new FormData()
    form.append('file', blob)
    Object.entries(presignResponse.formData)
      .filter(([k]) => k !== 'bucket')
      .forEach(([k, v]) => form.set(k, v))
    form.set('key', key)

    const response = await fetch(presignResponse.postURL, {
      method: 'POST',
      body: form,
    })

    if (!response.ok) throw new Error('Cannot save object to centralized storage')
  }
}
