import { Registry, HashUris } from './registry';

export class TestRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    constructor(public url: string) {
        // example: https://test.dapplets.org/api/registry/dapplet-base
        if (!url) throw new Error("Endpoint Url is required");
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        try {
            const response = await fetch(`${this.url}/registry/get-versions?name=${name}&branch=${branch}`);
            if (!response.ok) throw Error(response.statusText);
            const json = await response.json();
            if (!json.success) throw Error(json.message);
            const versions = json.data;
            this.isAvailable = true;
            this.error = null;
            return versions;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async resolveToUris(name: string, branch: string, version: string): Promise<HashUris> {
        try {
            const response = await fetch(`${this.url}/registry/resolve-to-uri?name=${name}&branch=${branch}&version=${version}`);
            if (!response.ok) throw Error(response.statusText);
            const json = await response.json();
            if (!json.success) throw Error(json.message);
            this.isAvailable = true;
            this.error = null;
            return {
                hash: json.data.hash,
                uris: json.data.uris.map(u => (u.indexOf('://') === -1) ? `${this.url}/storage/${u}` : u)
            };
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        try {
            const response = await fetch(`${this.url}/registry/get-features?${hostnames.map(h => `hostname=${h}`).join('&')}`);
            if (!response.ok) throw Error(response.statusText);
            const json = await response.json();
            if (!json.success) throw Error(json.message);
            const features = json.data;
            this.isAvailable = true;
            this.error = null;
            return features;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]> {
        return Promise.resolve([]);
    }

    public async addModuleWithObjects(name: string, branch: string, version: string, hashUris: HashUris[], key: string): Promise<void> {
        const hashUrisSingle = hashUris.map(x => ({ hash: x.hash, uri: x.uris[0] }));
        const response = await fetch(`${this.url}/registry/add-module-with-objects?name=${name}&branch=${branch}&version=${version}&hashUris=${JSON.stringify(hashUrisSingle)}&key=${key}`, {
            method: 'POST'
        });

        if (!response.ok) throw Error(response.statusText);
        const json = await response.json();
        if (!json.success) throw Error(json.message);
    }

    public async hashToUris(hash: string): Promise<HashUris> {
        try {
            const response = await fetch(`${this.url}/registry/hash-to-uris?hash=${hash}`);
            if (!response.ok) throw Error(response.statusText);
            const json = await response.json();
            if (!json.success) throw Error(json.message);
            this.isAvailable = true;
            this.error = null;
            return {
                hash: hash,
                uris: json.data.map(u => (u.indexOf('://') === -1) ? `${this.url}/storage/${u}` : u)
            };
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }
}