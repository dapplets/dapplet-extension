import { Storage } from './storage';
import { HttpStorage } from './httpStorage';

export class StorageManager implements Storage {

    async getResource(uri: string): Promise<ArrayBuffer> {
        const protocol = new URL(uri).protocol;
        const storage: Storage = this._chooseRegistry(protocol);
        const resource = await storage.getResource(uri);
        return resource;
    }

    private _chooseRegistry(protocol: string): Storage {
        switch (protocol) {
            case "http:":
                return new HttpStorage();
            case "https:":
                return new HttpStorage();
            default:
                throw new Error("Unsupported protocol");
        }
    }

}