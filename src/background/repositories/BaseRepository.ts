import { MapperService } from 'simple-mapper'; // ToDo like [here](https://www.npmjs.com/package/simple-mapper)
import Base from '../models/Base';

export default abstract class BaseRepository<T extends Base> {

    private _mapper = new MapperService();

    public constructor(private _TConstructor: new (...args: any[]) => T) { }

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

                    const item = this._mapper.map(this._TConstructor, value);
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
                if (!item.id) {
                    reject("ID must be specified"); // ToDo. Where is ID generated?
                    return;
                }

                const key = this._TConstructor.name + ':' + item.id;

                chrome.storage.local.get(key, result => {
                    if (!!result[key]) {
                        reject(`Item [${key}] already exists`); // ToDo. Is it allowed to replace the object?
                        return;
                    }

                    try {
                        const result = { [key]: item };
                        chrome.storage.local.set(result, () => resolve);
                    } catch (e) {
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async update(id: string, item: T): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const key = this._TConstructor.name + ':' + id;

                chrome.storage.local.get(key, result => {
                    if (!!result[key]) {
                        reject(`Item [${key}] doesn't exist`); // ToDo. Is it allowed to edit nonexistent item?
                        return;
                    }

                    try {
                        const result = { [key]: item };
                        chrome.storage.local.set(result, () => resolve);
                    } catch (e) {
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async delete(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const key = this._TConstructor.name + ':' + id;

                chrome.storage.local.get(key, result => {
                    if (!!result[key]) {
                        reject(`Item [${key}] doesn't exist`); // ToDo. Is it allowed to delete nonexistent item?
                        return;
                    }

                    try {
                        chrome.storage.local.remove(key, () => resolve);
                    } catch (e) {
                        reject(e);
                    }
                });                
            } catch (e) {
                reject(e);
            }
        });
    }

    async deleteAll(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(null, result => {
                    const keys : string[] = [];

                    for (const key in result) {
                        if (key.indexOf(this._TConstructor.name + ':') == 0) {
                            keys.push(key);
                        }                        
                    }

                    if (keys.length > 0) {
                        chrome.storage.local.remove(keys, () => resolve);
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