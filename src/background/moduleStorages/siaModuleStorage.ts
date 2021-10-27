import { Storage as ModuleStorage } from './storage';
import { timeoutPromise, joinUrls } from '../../common/helpers';
import { SkynetClient } from "skynet-js";

export class SiaModuleStorage implements ModuleStorage {

    private _client: SkynetClient;
    public timeout = 5000;

    constructor(config: { siaPortalUrl: string }) {
        this._client = new SkynetClient(config.siaPortalUrl);
    }

    public async getResource(uri: string, fetchController: AbortController = new AbortController()): Promise<ArrayBuffer> {
        // ToDo: implement abort
        const ref = this._extractReference(uri);
        const response = await this._client.getFileContent<ArrayBuffer>(ref, { responseType: 'arraybuffer' });
        return response.data;
    }

    private _extractReference(uri: string) {
        return uri.replace('sia://', '');
    }

    public async save(blob: Blob) {
        const file = new File([blob], 'filename');
        const { skylink } = await this._client.uploadFile(file);
        const url = "sia://" + skylink.replace('sia://', '').replace('sia:','');
        return url;
    }

    public async saveDir(tarBlob: Blob): Promise<string> {
        // ToDo: implement
        throw new Error("Not implemented");
    }
}