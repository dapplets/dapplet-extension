import { Registry, StorageRef } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import { WalletConnectSigner } from '../utils/walletConnectSigner';
import Manifest from '../models/manifest';
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes } from '../../common/constants';
import VersionInfo from '../models/versionInfo';

const moduleTypesMap = {
    1: ModuleTypes.Feature,
    2: ModuleTypes.Adapter,
    3: ModuleTypes.Library,
    4: ModuleTypes.Interface
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
            const moduleInfosByCtx = await this._contract.getModuleInfoBatch(contextIds, usersNormalized, 0);
            this.isAvailable = true;
            this.error = null;

            const result = Object.fromEntries(moduleInfosByCtx.map((modules, i) => {
                const ctx = contextIds[i];
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

    public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
        console.log('getVersionNumbers', { name, branch });
        try {
            const hex = await this._contract.getVersionNumbers(name, branch);
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

    public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        console.log('getVersionInfo', { name, branch, version });
        try {
            const { dto, moduleType } = await this._contract.getVersionInfo(name, branch, semver.major(version), semver.minor(version), semver.patch(version));

            const vi = new VersionInfo();
            vi.name = name;
            vi.branch = branch;
            vi.version = version;
            vi.type = moduleTypesMap[moduleType];
            vi.dist = {
                hash: dto.binary.hash,
                uris: dto.binary.uris.map(u => ethers.utils.toUtf8String(u))
            }
            vi.dependencies = Object.fromEntries(dto.dependencies.map(d => ([
                d.name,
                d.major + '.' + d.minor + '.' + d.patch
            ])));

            this.isAvailable = true;
            this.error = null;
            return vi;
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