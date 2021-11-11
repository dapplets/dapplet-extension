import { Registry, StorageRef } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../../common/constants';
import VersionInfo from '../models/versionInfo';
import { typeOfUri, UriTypes } from '../../common/helpers';


type EthStorageRef = {
    hash: string; // bytes32
    uris: string[]; // bytes[]
}

type EthModuleInfo = {
    moduleType: number; // uint8
    name: string; // string
    owner: string; // bytes32
    interfaces: string[]; // string[]
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
    title: string; // string
    description: string; // string
    icon: EthStorageRef;
    binary: EthStorageRef;
    dependencies: EthDependencyDto[];
    interfaces: EthDependencyDto[]; // bytes32[] 
    flags: number; // uint8 
}

const moduleTypesMap: { [key: number]: ModuleTypes } = {
    1: ModuleTypes.Feature,
    2: ModuleTypes.Adapter,
    3: ModuleTypes.Library,
    4: ModuleTypes.Interface
};

// ToDo: errors from here don't reach contentscript!
export class EthRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    private _moduleInfoCache = new Map<string, Map<string, ModuleInfo[]>>();
    private _contract: ethers.ethers.Contract = null;
    private get _contractPromise(): Promise<ethers.ethers.Contract> {
        if (this._contract) {
            return Promise.resolve(this._contract);
        } else {
            return this._signer.resolveName(this.url).then(x => {
                this._contract = new ethers.Contract(x, abi, this._signer);
                return this._contract;
            });
        }
    };

    constructor(public url: string, private _signer: ethers.ethers.Signer) {
        if (!url) throw new Error("Endpoint Url is required");
    }

    public async getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        const misByContextId = await this._getModuleInfoPartial(contextIds, users);
        // ToDo: optimize the number of external requests to reduce loading time
        const values = await Promise.all(Object.values(misByContextId).map(mis => 
            Promise.all(mis.map(x => 
                this.getVersionNumbers(x.name, DEFAULT_BRANCH_NAME)
                    .then(y => (y.length > 0) ? this._contract.getVersionInfo(
                            x.name, 
                            DEFAULT_BRANCH_NAME, 
                            semver.major(y[y.length - 1]), 
                            semver.minor(y[y.length - 1]), 
                            semver.patch(y[y.length - 1])
                        ) : null)
                    .then(z => {
                        if (z) {
                            const {dto} = z;
                            x.title = dto.title;
                            x.description = dto.description;
                            x.icon = {
                                hash: dto.icon.hash,
                                uris: dto.icon.uris.map(u => ethers.utils.toUtf8String(u))
                            }
                        }
                        return x;
                    })
            ))
        ));
        const keys = Object.keys(misByContextId);
        const entries = keys.map((x, i) => ([x, values[i]]));
        const object = Object.fromEntries(entries);
        return object;
    }

    private async _getModuleInfoPartial(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        try {
            users = users.filter(x => typeOfUri(x) === UriTypes.Ens || typeOfUri(x) === UriTypes.Ethereum);
            users = await Promise.all(users.map(u => (typeOfUri(u) === UriTypes.Ens) ? this._signer.resolveName(u) : Promise.resolve(u)));
            users = users.filter(u => u !== null);
            const usersCacheKey = users.join(';');
            
            // ToDo: maybe it's overcached
            if (!this._moduleInfoCache.has(usersCacheKey)) this._moduleInfoCache.set(usersCacheKey, new Map());
            if (contextIds.map(c => this._moduleInfoCache.get(usersCacheKey).has(c)).every(c => c === true)) {
                const cachedResult = Object.fromEntries(contextIds.map(c => ([c, this._moduleInfoCache.get(usersCacheKey).get(c)])));
                return cachedResult;
            }

            const usersNormalized = users.map(u => "0x000000000000000000000000" + u.replace('0x', ''));
            const contract = await this._contractPromise;
            const moduleInfosByCtx: EthModuleInfo[][] = await contract.getModuleInfoBatch(contextIds, usersNormalized, 0);
            this.isAvailable = true;
            this.error = null;

            const result = Object.fromEntries(moduleInfosByCtx.map((modules, i) => {
                const ctx = contextIds[i];
                const mis = modules.map(m => {
                    const mi = new ModuleInfo();
                    mi.type = moduleTypesMap[m.moduleType];
                    mi.name = m.name;
                    // mi.title = m.title;
                    // mi.description = m.description;
                    mi.author = m.owner.replace('0x000000000000000000000000', '0x');
                    // mi.icon = {
                    //     hash: m.icon.hash,
                    //     uris: m.icon.uris.map(u => ethers.utils.toUtf8String(u))
                    // };
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
            console.error('Error in EthRegistry class when module info is fetching', err);
            throw err;
        }
    }

    public async getModuleInfoByName(name: string): Promise<ModuleInfo> {
        try {
            const contract = await this._contractPromise;
            const m = await contract.getModuleInfoByName(name);
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
            //console.error(err);
            return null;
        }
    }

    public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
        try {
            const contract = await this._contractPromise;
            const hex: string = await contract.getVersionNumbers(name, branch);
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
            const contract = await this._contractPromise;
            const response = await contract.getVersionInfo(name, branch, semver.major(version), semver.minor(version), semver.patch(version));
            const dto: EthVersionInfoDto = response.dto;
            const moduleType: number = response.moduleType;

            const vi = new VersionInfo();
            vi.registryUrl = this.url;
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
            const contract = await this._contractPromise;
            const mi = await contract.getModuleInfoByName(module.name);
            isModuleExist = true;
        } catch (err) {
            isModuleExist = false;
        }

        const mi: EthModuleInfo = {
            name: module.name,
            moduleType: parseInt(Object.entries(moduleTypesMap).find(([k, v]) => v === module.type)[0]),
            flags: 0,
            owner: "0x0000000000000000000000000000000000000000000000000000000000000000",
            interfaces: module.interfaces || []
        };

        const vi: EthVersionInfoDto = {
            branch: version.branch,
            major: semver.major(version.version),
            minor: semver.minor(version.version),
            patch: semver.patch(version.version),
            title: module.title,
            description: module.description,
            icon: module.icon ? {
                hash: module.icon.hash,
                uris: module.icon.uris.map(u => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(u)))
            } : {
                    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    uris: []
                },
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
            })) || [],
            flags: 0
        };

        const contract = await this._contractPromise;
        if (!isModuleExist) {
            const tx = await contract.addModuleInfo(module.contextIds, mi, [vi]);
            await tx.wait();
        } else {
            const tx = await contract.addModuleVersion(mi.name, vi);
            await tx.wait();
        }
    }

    // ToDo: use getModuleInfoByName instead
    public async getOwnership(moduleName: string) {
        try {
            const contract = await this._contractPromise;
            const mi = await contract.getModuleInfoByName(moduleName);
            return mi.owner.replace('0x000000000000000000000000', '0x');
        } catch {
            return null;
        }
    }

    public async transferOwnership(moduleName: string, address: string) {
        if (address.length === 42) address = '0x000000000000000000000000' + address.replace('0x', '');
        const contract = await this._contractPromise;
        const tx = await contract.transferOwnership(moduleName, address);
        await tx.wait();
    }

    public async addContextId(moduleName: string, contextId: string) {
        const contract = await this._contractPromise;
        const tx = await contract.addContextId(moduleName, contextId);
        await tx.wait();
    }

    public async removeContextId(moduleName: string, contextId: string) {
        const contract = await this._contractPromise;
        const tx = await contract.removeContextId(moduleName, contextId);
        await tx.wait();
    }
}