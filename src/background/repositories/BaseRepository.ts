//import { TypedJSON } from 'typedjson';

export default class BaseRepository<T> {
    public constructor(private tCtor: new (...args: any[]) => T) { }

    async getById(id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const key = this.tCtor.name + "/" + id;
            chrome.storage.local.get(key, items => {
                const item = items[key];
                if (!item) {
                    resolve(null);
                    return;
                }
                resolve(item as T);
            });
        });
    }

    async create(value: T): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const key = this.tCtor.name + "/" + 2;
                const obj = {};
                obj[key] = value;
                chrome.storage.local.set(obj, () => resolve);
            } catch (e) {
                reject(e);
            }
        });
    }

    test<T>(): void {
        console.log('tCtor', this.tCtor.name);
    }
}