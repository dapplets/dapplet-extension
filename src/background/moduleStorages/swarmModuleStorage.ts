import { Storage as ModuleStorage } from './storage';
import { timeoutPromise } from '../../common/helpers';

export class SwarmModuleStorage implements ModuleStorage {

    private _gateway = "https://swarm.dapplets.org/";

    public timeout = 5000;
    
    public async getResource(uri: string): Promise<ArrayBuffer> {

        const c = new AbortController();
        const response = await timeoutPromise(this.timeout, fetch(this._gateway + "files/" + this._extractReference(uri), { signal: c.signal }), () => c.abort());

        if (!response.ok) {
            throw new Error(`HttpStorage can't load resource by URI ${uri}`);
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
        const response = await fetch(this._gateway + 'files', {
            method: 'POST',
            body: blob
        });
    
        const json = await response.json();
        if (!json.reference) throw new Error("Cannot upload file to Swarm."); // ToDo: show message
        const url = "bzz://" + json.reference;
        return url;
    }
}