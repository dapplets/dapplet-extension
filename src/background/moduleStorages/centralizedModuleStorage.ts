import { Storage as ModuleStorage } from './storage';
import { timeoutPromise } from '../../common/helpers';

export class CentralizedModuleStorage implements ModuleStorage {
    public timeout = 5000;
    private _endpoint = "https://dapplet-api.herokuapp.com/storage/";

    public async getResource(hash: string): Promise<ArrayBuffer> {
        const c = new AbortController();
        const response = await timeoutPromise(this.timeout, fetch(this._endpoint + hash, { signal: c.signal }), () => c.abort());

        if (!response.ok) {
            throw new Error(`CentralizedModuleStorage can't load resource by hash: ${hash}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }

    public async save(blob: Blob) {
        var form = new FormData();
        form.append('file', blob);
    
        const response = await fetch(this._endpoint, {
            method: 'POST',
            body: form
        });
    
        const json = await response.json();
        if (!json.success) throw new Error(json.message || "Cannot save object to centralized storage");
        if (!json.data || json.data.length !== 64) throw new Error("Invalid hash was returned by server");
        return json.data;
    }
}