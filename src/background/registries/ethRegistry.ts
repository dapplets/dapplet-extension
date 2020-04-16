import { Registry } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import { WalletConnectSigner } from '../utils/walletConnectSigner';

export class EthRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    private _contract: any = null;

    constructor(public url: string) { // url is a contract address
        // example: https://test.dapplets.org/api/registry/dapplet-base
        if (!url) throw new Error("Endpoint Url is required");

        const signer = new WalletConnectSigner();
        this._contract = new ethers.Contract(url, abi, signer);
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        try {
            const versions = await this._contract.getVersions(name, branch);
            this.isAvailable = true;
            this.error = null;
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

            const result = {};

            for (const m of modules) {
                if (!result[m[0]]) {
                    result[m[0]] = [];
                }

                result[m[0]].push(m[1]);
            }

            const result2 = { [hostnames[0]]: result };

            this.isAvailable = true;
            this.error = null;
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

    public async addModule(name: string, branch: string, version: string, uri: string): Promise<void> {
        await this._contract.addModule(name, branch, version, uri);
    }
}