import { KeyPair, keyStores } from 'near-api-js'
import { browserStorage_get, browserStorage_remove, browserStorage_set } from '../../communication'

const LOCAL_STORAGE_KEY_PREFIX = 'near-api-js:keystore:'

export class BackgroundKeyStore extends keyStores.KeyStore {
  private prefix: string

  constructor(keyStorePrefix?: string) {
    super()
    this.prefix = keyStorePrefix ?? LOCAL_STORAGE_KEY_PREFIX
  }

  async setKey(networkId: string, accountId: string, keyPair: KeyPair): Promise<void> {
    await browserStorage_set({
      [this.storageKeyForSecretKey(networkId, accountId)]: keyPair.toString(),
    })
  }

  async getKey(networkId: string, accountId: string): Promise<KeyPair> {
    const key = this.storageKeyForSecretKey(networkId, accountId)
    const result = await browserStorage_get(key)
    if (!result || !result[key]) {
      return null
    }
    return KeyPair.fromString(result[key])
  }

  async removeKey(networkId: string, accountId: string): Promise<void> {
    browserStorage_remove(this.storageKeyForSecretKey(networkId, accountId))
  }

  async clear(): Promise<void> {
    const keys = await this.storageKeys()
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        await browserStorage_remove(key)
      }
    }
  }

  async getNetworks(): Promise<string[]> {
    const result = new Set<string>()
    const keys = await this.storageKeys()
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const parts = key.substring(this.prefix.length).split(':')
        result.add(parts[1])
      }
    }
    return Array.from(result.values())
  }

  async getAccounts(networkId: string): Promise<string[]> {
    const result = new Array<string>()
    const keys = await this.storageKeys()
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const parts = key.substring(this.prefix.length).split(':')
        if (parts[1] === networkId) {
          result.push(parts[0])
        }
      }
    }
    return result
  }

  private storageKeyForSecretKey(networkId: string, accountId: string): string {
    return `${this.prefix}${accountId}:${networkId}`
  }

  private async storageKeys(): Promise<string[]> {
    const storage = await browserStorage_get()
    return Object.keys(storage)
  }
}
