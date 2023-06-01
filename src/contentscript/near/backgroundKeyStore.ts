import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { KeyPair, keyStores } from 'near-api-js'
import browser from 'webextension-polyfill'

const LOCAL_STORAGE_KEY_PREFIX = 'near-api-js:keystore:'

export class BackgroundKeyStore extends keyStores.KeyStore {
  private prefix: string

  constructor(keyStorePrefix?: string) {
    super()
    this.prefix = keyStorePrefix ?? LOCAL_STORAGE_KEY_PREFIX
  }

  async setKey(networkId: string, accountId: string, keyPair: KeyPair): Promise<void> {
    const { localStorage_setItem } = await initBGFunctions(browser)
    await localStorage_setItem(
      this.storageKeyForSecretKey(networkId, accountId),
      keyPair.toString()
    )
  }

  async getKey(networkId: string, accountId: string): Promise<KeyPair> {
    const { localStorage_getItem } = await initBGFunctions(browser)
    const key = this.storageKeyForSecretKey(networkId, accountId)
    const result = await localStorage_getItem(key)
    if (!result || !result[key]) {
      return null
    }
    return KeyPair.fromString(result[key])
  }

  async removeKey(networkId: string, accountId: string): Promise<void> {
    const { localStorage_removeItem } = await initBGFunctions(browser)
    await localStorage_removeItem(this.storageKeyForSecretKey(networkId, accountId))
  }

  async clear(): Promise<void> {
    const { localStorage_removeItem } = await initBGFunctions(browser)
    const keys = await this.storageKeys()
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        await localStorage_removeItem(key)
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
    const { localStorage_length, localStorage_key } = await initBGFunctions(browser)
    const length = await localStorage_length()
    const keys = []
    for (let i = 0; i < length; i++) {
      keys.push(localStorage_key(i))
    }
    return Promise.all(keys)
  }
}
