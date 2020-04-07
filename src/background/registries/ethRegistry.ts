import { Registry } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";

export class EthRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    private _contract: any = null;

    constructor(public url: string) { // url is a contract address
        // example: https://test.dapplets.org/api/registry/dapplet-base
        if (!url) throw new Error("Endpoint Url is required");

        // ToDo: remove API key
        let provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992');
        let contract = new ethers.Contract(url, abi, provider);

        this._contract = contract;
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        try {
            const versions = await this._contract.getVersions(name, branch);
            this.isAvailable = true;
            this.error = null;
            console.log('getVersions', versions);
            return versions;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        try {
            const uris = await this._contract.resolveToUri(name, branch, version);
            this.isAvailable = true;
            this.error = null;
            console.log('resolveToUri', uris);
            return uris;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        try {
            const modules: string[2][] = await this._contract.getModules(hostnames[0]);

            const result = { };

            for (const m of modules) {
                if (!result[m[0]]) {
                    result[m[0]] = [];
                }

                result[m[0]].push(m[1]);
            }

            const result2 = { [hostnames[0]]: result };

            this.isAvailable = true;
            this.error = null;
            console.log('getFeatures', result2);
            return result2;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]> {
        return Promise.resolve([]);
    }
}