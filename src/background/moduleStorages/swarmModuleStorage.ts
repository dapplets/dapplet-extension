import { DirectoryData, Storage as ModuleStorage } from './storage';
import { timeoutPromise, joinUrls } from '../../common/helpers';

export class SwarmModuleStorage implements ModuleStorage {

    private _gateway: string;
    private _swarmPostageStampId: string;
    public timeout = 60000;

    constructor(config: { swarmGatewayUrl: string, swarmPostageStampId: string }) {
        this._gateway = config.swarmGatewayUrl;
        this._swarmPostageStampId = config.swarmPostageStampId;
    }

    public async getResource(uri: string, fetchController: AbortController = new AbortController()): Promise<ArrayBuffer> {

        const response = await timeoutPromise(
            this.timeout,
            fetch(joinUrls(this._gateway, "bzz/" + this._extractReference(uri)), { signal: fetchController.signal }),
            () => fetchController.abort()
        );

        if (!response.ok) {
            throw new Error(`SwarmStorage can't load resource by URI ${uri}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }

    private _extractReference(uri: string) {
        const result = uri.match(/[0-9a-fA-F]{64}/gm);
        if (!result || result.length === 0) throw new Error("Invalid Swarm URI");
        return result[0];
    }

    public async save(blob: Blob) {
        const response = await fetch(joinUrls(this._gateway, 'bzz'), {
            method: 'POST',
            body: blob,
            headers: {
                'swarm-collection': 'false',
                'swarm-postage-batch-id': this._swarmPostageStampId
            }
        });

        if (!response.ok) {
            const error = await response.json()
                .then(x => `${x.code} ${x.message}`)
                .catch(() => `${response.status} ${response.statusText}`);

            throw new Error(error);
        }

        const json = await response.json();
        if (!json.reference) throw new Error("Cannot upload file to Swarm."); // ToDo: show message
        const url = "bzz://" + json.reference;
        return url;
    }

    public async saveDir(data: DirectoryData): Promise<string> {
        const response = await fetch(joinUrls(this._gateway, 'bzz'), {
            method: 'POST',
            body: data.tar,
            headers: {
                'swarm-index-document': 'index.html',
                'swarm-collection': 'true',
                'swarm-postage-batch-id': this._swarmPostageStampId
            }
        });

        if (!response.ok) {
            const error = await response.json()
                .then(x => `${x.code} ${x.message}`)
                .catch(() => `${response.status} ${response.statusText}`);

            throw new Error(error);
        }

        const json = await response.json();
        if (!json.reference) throw new Error("Cannot upload file to Swarm."); // ToDo: show message
        const url = "bzz://" + json.reference;
        return url;
    }
}