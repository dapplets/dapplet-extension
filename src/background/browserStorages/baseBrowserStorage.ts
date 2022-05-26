import { MapperService } from 'simple-mapper' // ToDo like [here](https://www.npmjs.com/package/simple-mapper)
import { browser } from 'webextension-polyfill-ts'
import Base from '../../common/models/base'

export default abstract class BaseBrowserStorage<T extends Base> {
  private _mapperService = new MapperService()

  public constructor(
    private _TConstructor: new (...args: any[]) => T,
    private _storageName: string
  ) {}

  async getAll(filter?: (item: T) => boolean): Promise<T[]> {
    const result = await browser.storage.local.get(null)
    const items: T[] = []

    for (const key in result) {
      if (key.indexOf(this._storageName + ':') == 0) {
        const item = this._mapperService.map(this._TConstructor, result[key])
        if (filter == undefined || filter(item)) {
          items.push(item)
        }
      }
    }
    return items
  }

  async getById(id: string): Promise<T> {
    const key = this._storageName + ':' + id
    const result = await browser.storage.local.get(key)
    const value = result[key]

    // not found
    if (!value) {
      return null
    }

    const item = this._mapperService.map(this._TConstructor, value)
    return item
  }

  async create(item: T): Promise<void> {
    const mappedItem = this._mapperService.map(this._TConstructor, item)
    if (!mappedItem.getId()) throw new Error('ID must be specified') // ToDo: Where is ID generated?

    const key = this._storageName + ':' + mappedItem.getId()

    // const result = await browser.storage.local.get(key);
    // if (!!result[key]) throw new Error(`Item [${key}] already exists`); // ToDo: Is it allowed to replace the object?

    const data = { [key]: mappedItem }
    const clone = JSON.parse(JSON.stringify(data))
    await browser.storage.local.set(clone)
  }

  async update(item: T): Promise<void> {
    const mappedItem = this._mapperService.map(this._TConstructor, item)
    const key = this._storageName + ':' + mappedItem.getId()

    const result = { [key]: mappedItem }
    const clone = JSON.parse(JSON.stringify(result))
    await browser.storage.local.set(clone)
  }

  async delete(item: T): Promise<void> {
    this.deleteById(item.getId())
  }

  async deleteById(id: string): Promise<void> {
    const key = this._storageName + ':' + id
    await browser.storage.local.remove(key)
  }

  async deleteAll(): Promise<void> {
    const result = await browser.storage.local.get(null)
    const keys: string[] = []

    for (const key in result) {
      if (key.indexOf(this._storageName + ':') == 0) {
        keys.push(key)
      }
    }

    if (keys.length > 0) {
      await browser.storage.local.remove(keys)
    }
  }
}
