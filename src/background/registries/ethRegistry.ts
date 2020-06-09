import { Registry, StorageRef } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import { WalletConnectSigner } from '../utils/walletConnectSigner';
import Manifest from '../models/manifest';
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes } from '../../common/constants';

const moduleTypesMap = {
    1: ModuleTypes.Feature,
    2: ModuleTypes.Adapter,
    3: ModuleTypes.Resolver,
    4: ModuleTypes.Library,
    5: ModuleTypes.Interface
};

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

    public async getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        try {
            const usersNormalized = users.map(u => "0x000000000000000000000000" + u.replace('0x', ''));
            const moduleInfos = await Promise.all(contextIds.map(ctx => this._contract.getModuleInfo(ctx, usersNormalized, 0).then(m => ([ctx, m]))));
            this.isAvailable = true;
            this.error = null;

            const result = Object.fromEntries(moduleInfos.map(([ctx, modules]) => {
                const mis = modules.map(m => {
                    const mi = new ModuleInfo();
                    mi.type = moduleTypesMap[m.moduleType];
                    mi.name = m.name;
                    mi.title = m.title;
                    mi.description = m.description;
                    mi.author = m.owner;
                    mi.icon = {
                        hash: m.icon.hash,
                        uris: m.icon.uris.map(u => ethers.utils.toUtf8String(u))
                    };
                    return mi;
                });
                return [ctx, mis];
            }));

            return result;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        try {
            const hex = await this._contract.getVersions(name, branch, 0);
            this.isAvailable = true;
            this.error = null;
            const result = hex.replace('0x', '')
                              .match(/.{1,8}/g)
                              .map(x => `${parseInt('0x' + x[0] + x[1])}.${parseInt('0x' + x[2] + x[3])}.${parseInt('0x' + x[4] + x[5])}`);
            return result;            
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async resolveToManifest(name: string, branch: string, version: string): Promise<Manifest> {
        try {
            const m = await this._contract.resolveToManifest(name, branch, {
                major: semver.major(version),
                minor: semver.minor(version),
                patch: semver.patch(version)
            });
            console.log('resolveToManifest', { name, branch, version }, m);

            const manifest = new Manifest();
            manifest.name = m.name;
            manifest.branch = m.branch;
            manifest.version = `${m.major}.${m.minor}.${m.patch}`;
            manifest.title = m.title;
            manifest.description = m.description;
            manifest.icon = {
                hash: m.icon.hash,
                uris: m.icon.uris
            };
            manifest.type = { 1: "FEATURE", 2: "ADAPTER", 3: "RESOLVER", 4: "LIBRARY", 5: "INTERFACE" }[m.moduleType];
            manifest.dist = {
                hash: m.binary.hash,
                uris: m.binary.uris
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
            const modules: string[] = await this._contract.getModules(hostnames[0], [], 0);
            console.log('getFeatures', { hostnames }, modules);
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
            iconHash: manifest.icon ? (manifest.icon as StorageRef).hash : '0x0000000000000000000000000000000000000000000000000000000000000000',
            iconUris: manifest.icon ? (manifest.icon as StorageRef).uris : [],
            mod_type: manifest.type,
            author: manifest.author,
            distHash: (manifest.dist as StorageRef).hash, // hash of bundle
            distUris: (manifest.dist as StorageRef).uris,
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

    public async hashToUris(hash: string): Promise<StorageRef> {
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