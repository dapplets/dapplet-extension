import { Registry, StorageRef } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../../common/constants';
import VersionInfo from '../models/versionInfo';
import { typeOfUri, UriTypes } from '../../common/helpers';
import * as logger from '../../common/logger';

type EthStorageRef = {
    hash: string; // bytes32
    uris: string[]; // bytes[]
}

type EthModuleInfo = {
    moduleType: number; // uint8
    name: string; // string
    title: string; // string
    description: string; // string
    owner: string; // bytes32
    interfaces: string[]; // string[]
    icon: EthStorageRef;
    flags: number; // uint 
}

type EthDependencyDto = {
    name: string;
    branch: string;
    major: number;
    minor: number;
    patch: number;
};

type EthVersionInfoDto = {
    branch: string; // string
    major: number; // uint8 
    minor: number; // uint8 
    patch: number; // uint8 
    flags: number; // uint8 
    binary: EthStorageRef;
    dependencies: EthDependencyDto[];
    interfaces: EthDependencyDto[]; // bytes32[] 
}

const moduleTypesMap: { [key: number]: ModuleTypes } = {
    1: ModuleTypes.Feature,
    2: ModuleTypes.Adapter,
    3: ModuleTypes.Library,
    4: ModuleTypes.Interface
};

// ToDo: errors from here don't reach inpage!
export class EthRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    private _contract: ethers.ethers.Contract;
    private _moduleInfoCache = new Map<string, Map<string, ModuleInfo[]>>();

    constructor(public url: string, private _signer: ethers.ethers.Signer) {
        if (!url) throw new Error("Endpoint Url is required");
        this._contract = new ethers.Contract(url, abi, this._signer);
    }

    public async getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        try {
            users = users.filter(x => typeOfUri(x) === UriTypes.Ens || typeOfUri(x) === UriTypes.Ethereum);
            users = await Promise.all(users.map(u => (typeOfUri(u) === UriTypes.Ens) ? this._signer.resolveName(u) : Promise.resolve(u)));
            users = users.filter(u => u !== null);
            const usersCacheKey = users.join(';');
            if (!this._moduleInfoCache.has(usersCacheKey)) this._moduleInfoCache.set(usersCacheKey, new Map());
            if (contextIds.map(c => this._moduleInfoCache.get(usersCacheKey).has(c)).every(c => c === true)) {
                const cachedResult = Object.fromEntries(contextIds.map(c => ([c, this._moduleInfoCache.get(usersCacheKey).get(c)])));
                return cachedResult;
            }

            const usersNormalized = users.map(u => "0x000000000000000000000000" + u.replace('0x', ''));
            const moduleInfosByCtx: EthModuleInfo[][] = await this._contract.getModuleInfoBatch(contextIds, usersNormalized, 0);
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
                    mi.author = m.owner.replace('0x000000000000000000000000', '0x');
                    mi.icon = {
                        hash: m.icon.hash,
                        uris: m.icon.uris.map(u => ethers.utils.toUtf8String(u))
                    };
                    mi.interfaces = m.interfaces;
                    return mi;
                });

                if (!this._moduleInfoCache.get(usersCacheKey).has(ctx)) {
                    this._moduleInfoCache.get(usersCacheKey).set(ctx, mis);
                }

                return [ctx, mis];
            }));

            return result;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            logger.error('Error in EthRegistry class when module info is fetching', err);
            throw err;
        }
    }

    public async getModuleInfoByName(name: string): Promise<ModuleInfo> {
        try {
            const m = await this._contract.getModuleInfoByName(name);
            const mi = new ModuleInfo();
            mi.type = moduleTypesMap[m.moduleType];
            mi.name = m.name;
            mi.title = m.title;
            mi.description = m.description;
            mi.author = m.owner.replace('0x000000000000000000000000', '0x');
            mi.icon = {
                hash: m.icon.hash,
                uris: m.icon.uris.map(u => ethers.utils.toUtf8String(u))
            };
            mi.interfaces = m.interfaces;
            mi.registryUrl = this.url;
            return mi;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
        try {
            const hex: string = await this._contract.getVersionNumbers(name, branch);
            this.isAvailable = true;
            this.error = null;
            const result = (hex.replace('0x', '')
                .match(/.{1,8}/g) ?? [])
                .map(x => `${parseInt('0x' + x[0] + x[1])}.${parseInt('0x' + x[2] + x[3])}.${parseInt('0x' + x[4] + x[5])}`);
            return result;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        try {
            const response = await this._contract.getVersionInfo(name, branch, semver.major(version), semver.minor(version), semver.patch(version));
            const dto: EthVersionInfoDto = response.dto;
            const moduleType: number = response.moduleType;

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
            vi.interfaces = Object.fromEntries(dto.interfaces.map(d => ([
                d.name,
                d.major + '.' + d.minor + '.' + d.patch
            ])));

            this.isAvailable = true;
            this.error = null;
            return vi;
        } catch (err) {
            // ToDo: is it necessary to return error here? how to return null from contract?
            if (err.reason === "Version doesn't exist") return null;

            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]> {
        return Promise.resolve([]);
    }

    public async addModule(module: ModuleInfo, version: VersionInfo): Promise<void> {
        let isModuleExist = false;
        try {
            const mi = await this._contract.getModuleInfoByName(module.name);
            isModuleExist = true;
        } catch (err) {
            isModuleExist = false;
        }

        const mi: EthModuleInfo = {
            name: module.name,
            title: module.title,
            description: module.description,
            moduleType: parseInt(Object.entries(moduleTypesMap).find(([k, v]) => v === module.type)[0]),
            flags: 0,
            owner: "0x0000000000000000000000000000000000000000000000000000000000000000",
            icon: module.icon ? {
                hash: module.icon.hash,
                uris: module.icon.uris.map(u => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(u)))
            } : {
                    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    uris: []
                },
            interfaces: module.interfaces || []
        };

        const vi: EthVersionInfoDto = {
            branch: version.branch,
            major: semver.major(version.version),
            minor: semver.minor(version.version),
            patch: semver.patch(version.version),
            flags: 0,
            binary: version.dist ? {
                hash: version.dist.hash,
                uris: version.dist.uris.map(u => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(u)))
            } : {
                    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    uris: []
                },
            dependencies: version.dependencies && Object.entries(version.dependencies).map(([k, v]) => ({
                name: k,
                branch: "default",
                major: semver.major(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME]),
                minor: semver.minor(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME]),
                patch: semver.patch(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME])
            })) || [],
            interfaces: version.interfaces && Object.entries(version.interfaces).map(([k, v]) => ({
                name: k,
                branch: "default",
                major: semver.major(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME]),
                minor: semver.minor(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME]),
                patch: semver.patch(typeof v === 'string' ? v : v[DEFAULT_BRANCH_NAME])
            })) || []
        };

        const userId = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (!isModuleExist) {
            const tx = await this._contract.addModuleInfo(module.contextIds, mi, [vi], userId);
            await tx.wait();
        } else {
            const tx = await this._contract.addModuleVersion(mi.name, vi, userId);
            await tx.wait();
        }
    }

    // ToDo: use getModuleInfoByName instead
    public async getOwnership(moduleName: string) {
        try {
            const mi = await this._contract.getModuleInfoByName(moduleName);
            return mi.owner.replace('0x000000000000000000000000', '0x');
        } catch {
            return null;
        }
    }

    public async transferOwnership(moduleName: string, address: string) {
        const userId = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (address.length === 42) address = '0x000000000000000000000000' + address.replace('0x', '');
        const tx = await this._contract.transferOwnership(moduleName, userId, address);
        await tx.wait();
    }

    public async addContextId(moduleName: string, contextId: string) {
        const userId = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const tx = await this._contract.addContextId(moduleName, contextId, userId);
        await tx.wait();
    }

    public async removeContextId(moduleName: string, contextId: string) {
        const userId = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const tx = await this._contract.removeContextId(moduleName, contextId, userId);
        await tx.wait();
    }
}