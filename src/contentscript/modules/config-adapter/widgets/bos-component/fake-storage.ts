import { StorageService } from '@near-wallet-selector/core'

export class FakeStorage implements StorageService {
  _map = new Map<string, string>()

  async getItem(key: string): Promise<string> {
    return this._map.get(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    this._map.set(key, value)
  }

  async removeItem(key: string): Promise<void> {
    this._map.delete(key)
  }
}
