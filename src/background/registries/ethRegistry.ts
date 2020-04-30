import { Registry, HashUris } from './registry';
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

    public async resolveToUris(name: string, branch: string, version: string): Promise<HashUris> {
        try {
            const [hash, uris] = await this._contract.resolveToUris(name, branch, version);
            this.isAvailable = true;
            this.error = null;
            return { hash, uris };
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        try {
            const modules: string[] = await this._contract.getModules(hostnames[0]);
            const result = {};
            for (const m of modules) {
                result[m] = ['default'];
            }

            const result2 = {
                [hostnames[0]]: result
            };

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

    public async addModuleWithObjects(name: string, branch: string, version: string, hashUris: HashUris[]): Promise<void> {
        const hashUrisSingle = hashUris.map(x => ({ hash: '0x' + x.hash, uri: x.uris[0] }));
        const tx = await this._contract.addModuleWithObjects(name, branch, version, hashUrisSingle);

        await new Promise((resolve, reject) => {
            this._contract.on("ModuleAdded", (name, branch, verison, manifestHash, event) => {
                if (event.transactionHash === tx.hash) {
                    resolve();
                }
            });
        });

        // await tx.wait();
    }

    public async hashToUris(hash: string): Promise<HashUris> {
        try {
            const uris = await this._contract.hashToUris('0x' + hash);
            this.isAvailable = true;
            this.error = null;
            return { hash, uris };
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getOwnership(moduleName: string) {
        const owner = await this._contract.infoByName(moduleName);
        return owner;
    }

    public async transferOwnership(moduleName: string, address: string) {
        const tx = await this._contract.transferOwnership(moduleName, address);
        await tx.wait();
    }

    public async addLocation(moduleName: string, location: string) {
        const tx = await this._contract.addLocation(moduleName, location);
        await tx.wait();
    }

    public async removeLocation(moduleName: string, location: string) {
        const modules: string[] = await this._contract.getModules(location);
        const moduleNameIndex = modules.indexOf(moduleName);
        const tx = await this._contract.removeLocation(location, moduleNameIndex, moduleName);
        await tx.wait();
    }
}