import { Registry } from './registry';

export class TestRegistry implements Registry {
    constructor(public endpointUrl: string) {
        // example: https://test.dapplets.org/api/registry/dapplet-base
        if (!endpointUrl) throw new Error("Endpoint Url is required");
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        const response = await fetch(`${this.endpointUrl}/get-versions?name=${name}&branch=${branch}`);
        const json = await response.json();
        const versions = json.data;
        return versions;
    }

    public async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        const response = await fetch(`${this.endpointUrl}/resolve-to-uri?name=${name}&branch=${branch}&version=${version}`);
        const json = await response.json();
        // ToDo: fix it
        const uris = json.data.map(uri => `${new URL(this.endpointUrl).origin}/api/storage/${uri}`);
        return uris;
    }

    public async getFeatures(hostname: string): Promise<{ [name: string]: string[]; }> {
        const response = await fetch(`${this.endpointUrl}/get-features?hostname=${hostname}`);
        const json = await response.json();
        const features = json.data;
        return features;
    }
}