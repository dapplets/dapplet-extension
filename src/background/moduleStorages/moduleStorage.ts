import { Storage } from './storage';
import { HttpModuleStorage } from './httpModuleStorage';
import { SwarmModuleStorage } from './swarmModuleStorage';

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
            case "https:":
                return new HttpModuleStorage();
            case "bzz:":
                return new SwarmModuleStorage();
            default:
                throw new Error("Unsupported protocol");
        }
    }
}