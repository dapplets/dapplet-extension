import { DirectoryData, Storage as ModuleStorage } from './storage';
import { timeoutPromise, joinUrls } from '../../common/helpers';
import { SkynetClient, parseSkylink } from "skynet-js";

export class SiaModuleStorage implements ModuleStorage {

    private _client: SkynetClient;
    public timeout = 5000;

    constructor(config: { siaPortalUrl: string }) {
        this._client = new SkynetClient(config.siaPortalUrl);
    }

    public async getResource(uri: string, fetchController: AbortController = new AbortController()): Promise<ArrayBuffer> {
        // ToDo: implement abort
        const ref = parseSkylink(uri);
        const response = await this._client.getFileContent<ArrayBuffer>(ref, { responseType: 'arraybuffer' });
        return response.data;
    }

    public async save(blob: Blob) {
        const file = new File([blob], 'filename');
        const { skylink } = await this._client.uploadFile(file);
        const url = "sia://" + parseSkylink(skylink);
        return url;
    }

    async saveDir(data: DirectoryData): Promise<string> {
        const hash = data.hash.replace('0x', '');
        const files = Object.fromEntries(data.files.map(x => ([x.url, new File([x.arr], x.url)])));
        const { skylink } = await this._client.uploadDirectory(files, hash);      
        const url = "sia://" + parseSkylink(skylink);
        return url;
    }
}