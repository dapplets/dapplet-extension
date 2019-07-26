import { MapperService } from 'simple-mapper'; // ToDo like [here](https://www.npmjs.com/package/simple-mapper)
import Base from '../models/base';

export default abstract class BaseBrowserStorage<T extends Base> {

    private _mapperService = new MapperService();

    public constructor(private _TConstructor: new (...args: any[]) => T) { }

    async getAll(filter?: (item: T) => boolean): Promise<T[]> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(null, result => {
                    const items: T[] = [];

                    for (const key in result) {
                        if (key.indexOf(this._TConstructor.name + ':') == 0) {
                            const item = this._mapperService.map(this._TConstructor, result[key]);
                            if (filter == undefined || filter(item)) {
                                items.push(item);
                            }
                        }
                    }

                    resolve(items);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async getById(id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            try {
                const key = this._TConstructor.name + ':' + id;
                chrome.storage.local.get(key, result => {
                    const value = result[key];

                    // not found
                    if (!value) {
                        resolve(null);
                        return;
                    }

                    const item = this._mapperService.map(this._TConstructor, value);
                    resolve(item);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async create(item: T): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (!item.getId()) {
                    reject("ID must be specified"); // ToDo: Where is ID generated?
                    return;
                }

                const key = this._TConstructor.name + ':' + item.getId();

                chrome.storage.local.get(key, result => {
                    if (!!result[key]) {
                        reject(`Item [${key}] already exists`); // ToDo: Is it allowed to replace the object?
                        return;
                    }

                    try {
                        const result = { [key]: item };
                        chrome.storage.local.set(result, () => resolve());
                    } catch (e) {
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async update(item: T): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const mappedItem = this._mapperService.map(this._TConstructor, item);
                const key = this._TConstructor.name + ':' + mappedItem.getId();

                const result = { [key]: mappedItem };
                chrome.storage.local.set(result, () => resolve());
            } catch (e) {
                reject(e);
            }
        });
    }
    async delete(item: T): Promise<void> {
        this.deleteById(item.getId());
    }

    async deleteById(id: string): Promise<void>  {
        return new Promise((resolve, reject) => {
            try {
                const key = this._TConstructor.name + ':' + id;

                try {
                    chrome.storage.local.remove(key, () => resolve());
                } catch (e) {
                    reject(e);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    async deleteAll(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(null, result => {
                    const keys: string[] = [];

                    for (const key in result) {
                        if (key.indexOf(this._TConstructor.name + ':') == 0) {
                            keys.push(key);
                        }
                    }

                    if (keys.length > 0) {
                        chrome.storage.local.remove(keys, () => resolve());
                    } else {
                        resolve();
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}