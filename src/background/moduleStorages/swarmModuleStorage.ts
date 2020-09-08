import { Storage as ModuleStorage } from './storage';
import { timeoutPromise } from '../../common/helpers';

export class SwarmModuleStorage implements ModuleStorage {

    public timeout = 5000;
    
    public async getResource(uri: string): Promise<ArrayBuffer> {

        const c = new AbortController();
        const response = await timeoutPromise(this.timeout, fetch("https://swarm-gateways.net/" + this._normilize(uri), { signal: c.signal }), () => c.abort());

        if (!response.ok) {
            throw new Error(`HttpStorage can't load resource by URI ${uri}`);
        }

        const buffer = await response.arrayBuffer();

        return buffer;
    }

    private _normilize(uri: string) {
        let normalized = uri.replace('bzz://', 'bzz:/');
        if (normalized[length - 1] !== '/') normalized += '/';
        return normalized;
    }

    public async save(blob: Blob) {
        const response = await fetch("https://swarm-gateways.net/bzz:/", {
            method: 'POST',
            body: blob
        });
    
        const text = await response.text();
        if (text.length !== 64) throw new Error("Swarm gateway returned invalid hash.");
        const url = "bzz://" + text;
        return url;
    }
}