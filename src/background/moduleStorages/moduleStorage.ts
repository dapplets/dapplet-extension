import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';

export class StorageAggregator implements Storage {

    async getResource(uri: string): Promise<ArrayBuffer> {
        const protocol = new URL(uri).protocol;
        const storage: Storage = this._chooseStorage(protocol);
        const resource = await storage.getResource(uri);
        return resource;
    }

    private _chooseStorage(protocol: string): Storage {
        switch (protocol) {
            case "http:":
                return new HttpModuleStorage();
            case "https:":
                return new HttpModuleStorage();
            default:
                throw new Error("Unsupported protocol");
        }
    }
}