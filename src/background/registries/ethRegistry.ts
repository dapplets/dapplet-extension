import { Registry, HashUris } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import { WalletConnectSigner } from '../utils/walletConnectSigner';
import Manifest from '../models/manifest';

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

    public async getManifests(locations: string[]): Promise<{ [x: string]: Manifest[] }> {
        try {
            const location = locations[0];
            const manifests = await this._contract.getManifests(location);
            this.isAvailable = true;
            this.error = null;
            const result = {
                [location]: manifests.map(m => {
                    const manifest = new Manifest();
                    manifest.name = m.name;
                    manifest.branch = m.branch;
                    manifest.version = m.version;
                    manifest.title = m.title;
                    manifest.description = m.description;
                    manifest.icon = {
                        hash: m.iconHash,
                        uris: m.iconUris
                    };
                    manifest.type = m.mod_type;
                    manifest.dist = {
                        hash: m.distHash,
                        uris: m.distUris
                    }
                    manifest.dependencies = Object.fromEntries(m.dependencies);
                    return manifest;
                })
            };
            return result;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
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

    public async resolveToManifest(name: string, branch: string, version: string): Promise<Manifest> {
        try {
            const m = await this._contract.resolveToManifest(name, branch, version);

            const manifest = new Manifest();
            manifest.name = name;
            manifest.branch = branch;
            manifest.version = version;
            manifest.title = m.title;
            manifest.description = m.description;
            manifest.icon = {
                hash: m.iconHash,
                uris: m.iconUris
            };
            manifest.type = m.mod_type;
            manifest.dist = {
                hash: m.distHash,
                uris: m.distUris
            }
            manifest.dependencies = Object.fromEntries(m.dependencies);

            this.isAvailable = true;
            this.error = null;
            return manifest;
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

    public async addModule(name: string, branch: string, version: string, manifest: Manifest): Promise<void> {
        const manifestForContract = {
            initialized: true,
            title: manifest.title,
            description: manifest.description,
            iconHash: manifest.icon ? (manifest.icon as HashUris).hash : '0x0000000000000000000000000000000000000000000000000000000000000000',
            iconUris: manifest.icon ? (manifest.icon as HashUris).uris : [],
            mod_type: manifest.type,
            author: manifest.author,
            distHash: (manifest.dist as HashUris).hash, // hash of bundle
            distUris: (manifest.dist as HashUris).uris,
            dependencies: Object.entries(manifest.dependencies)
        };
        const tx = await this._contract.addModule(name, branch, version, manifestForContract);

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