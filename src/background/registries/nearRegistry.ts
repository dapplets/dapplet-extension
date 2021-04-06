import { Registry } from './registry';
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../../common/constants';
import VersionInfo from '../models/versionInfo';
import * as logger from '../../common/logger';
import * as nearAPI from 'near-api-js';
import { ethers } from 'ethers';

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
    moduleType: number; // uint8
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
export class NearRegistry implements Registry {
    public isAvailable: boolean = true;
    public error: string = null;

    private _contract: any;
    private _moduleInfoCache = new Map<string, Map<string, ModuleInfo[]>>();

    constructor(public url: string, private _nearAccount: nearAPI.ConnectedWalletAccount) {
        this._contract = new nearAPI.Contract(this._nearAccount, this.url, {
            viewMethods: ['getModuleInfoBatch', 'getModuleInfo', 'getModuleInfoByName', 'getVersionNumbers', 'getVersionInfo'],
            changeMethods: ['addModuleInfo', 'addModuleVersion', 'addModuleVersionBatch', 'transferOwnership', 'addContextId', 'removeContextId']
        });
    }

    public async getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        // console.log('getModuleInfo', { contextIds, users });
        try {
            const usersCacheKey = users.join(';');
            if (!this._moduleInfoCache.has(usersCacheKey)) this._moduleInfoCache.set(usersCacheKey, new Map());
            if (contextIds.map(c => this._moduleInfoCache.get(usersCacheKey).has(c)).every(c => c === true)) {
                const cachedResult = Object.fromEntries(contextIds.map(c => ([c, this._moduleInfoCache.get(usersCacheKey).get(c)])));
                return cachedResult;
            }

            const moduleInfosByCtx: EthModuleInfo[][] = await this._contract.getModuleInfoBatch({ ctxIds: contextIds, users: users, maxBufLen: 0 });
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
                        hash: ethers.utils.hexlify(ethers.utils.base64.decode(m.icon.hash)),
                        uris: m.icon.uris.map(u => ethers.utils.toUtf8String(ethers.utils.base64.decode(u)))
                    };
                    mi.interfaces = m.interfaces;
                    return mi;
                });

                if (!this._moduleInfoCache.get(usersCacheKey).has(ctx)) {
                    this._moduleInfoCache.get(usersCacheKey).set(ctx, mis);
                }

                return [ctx, mis];
            }));

            // console.log('getModuleInfo', { result });

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
            // console.log('getModuleInfoByName', { name });

            const m = await this._contract.getModuleInfoByName({ mod_name: name });
            const mi = new ModuleInfo();
            mi.type = moduleTypesMap[m.moduleType];
            mi.name = m.name;
            mi.title = m.title;
            mi.description = m.description;
            mi.author = m.owner;
            mi.icon = {
                hash: ethers.utils.hexlify(ethers.utils.base64.decode(m.icon.hash)),
                uris: m.icon.uris.map(u => ethers.utils.toUtf8String(ethers.utils.base64.decode(u)))
            };
            mi.interfaces = m.interfaces;

            // console.log('getModuleInfoByName', { result: mi });
            return mi;
        } catch (err) {
            //console.error(err);
            return null;
        }
    }

    public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
        try {
            // console.log('getVersionNumbers', { name, branch });

            const versions = await this._contract.getVersionNumbers({ name: name, branch: branch });
            this.isAvailable = true;
            this.error = null;
            const result = versions.map(x => `${x.major}.${x.minor}.${x.patch}`);

            // console.log('getVersionNumbers', { result });

            return result;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        try {
            // console.log('getVersionInfo', { name, branch, version });

            const response = await this._contract.getVersionInfo({
                name: name,
                branch: branch,
                major: semver.major(version),
                minor: semver.minor(version),
                patch: semver.patch(version)
            });
            const dto: EthVersionInfoDto = response;
            const moduleType: number = response.moduleType;

            const vi = new VersionInfo();
            vi.name = name;
            vi.branch = branch;
            vi.version = version;
            vi.type = moduleTypesMap[moduleType];
            vi.dist = {
                hash: ethers.utils.hexlify(ethers.utils.base64.decode(dto.binary.hash)),
                uris: dto.binary.uris.map(u => ethers.utils.toUtf8String(ethers.utils.base64.decode(u)))
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

            // console.log('getVersionInfo', { result: vi });

            return vi;
        } catch (err) {
            // ToDo: is it necessary to return error here? how to return null from contract?
            // console.log('getVersionInfo', { error: err });

            if (err.message.indexOf('Version doesn\'t exist') !== -1) return null;

            this.isAvailable = false;
            this.error = err.message;
            throw err;
        }
    }

    public async getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]> {
        return Promise.resolve([]);
    }

    public async addModule(module: ModuleInfo, version: VersionInfo): Promise<void> {

        // console.log('addModule', { module, version });

        let isModuleExist = false;
        try {
            const mi = await this._contract.getModuleInfoByName({
                mod_name: module.name
            });
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
            owner: this._nearAccount.accountId,
            icon: module.icon ? {
                hash: ethers.utils.base64.encode(module.icon.hash),
                uris: module.icon.uris.map(u => ethers.utils.base64.encode(ethers.utils.toUtf8Bytes(u)))
            } : {
                hash: "",
                uris: []
            },
            interfaces: module.interfaces || []
        };

        const vi: EthVersionInfoDto = {
            moduleType: parseInt(Object.entries(moduleTypesMap).find(([k, v]) => v === module.type)[0]),
            branch: version.branch,
            major: semver.major(version.version),
            minor: semver.minor(version.version),
            patch: semver.patch(version.version),
            flags: 0,
            binary: version.dist ? {
                hash: ethers.utils.base64.encode(version.dist.hash),
                uris: version.dist.uris.map(u => ethers.utils.base64.encode(ethers.utils.toUtf8Bytes(u)))
            } : {
                hash: "",
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

        const userId = this._nearAccount.accountId;
        if (!isModuleExist) {
            await this._contract.addModuleInfo({
                contextIds: module.contextIds,
                mInfo: mi,
                vInfos: [vi],
                owner: userId
            });
        } else {
            await this._contract.addModuleVersion({
                mod_name: mi.name,
                vInfo: vi,
                owner: userId
            });
        }

        // console.log('addModule', { result: 'done' });
    }

    // ToDo: use getModuleInfoByName instead
    public async getOwnership(moduleName: string) {

        // console.log('getOwnership', { moduleName });

        try {
            const mi = await this._contract.getModuleInfoByName({ mod_name: moduleName });
            const result = mi.owner;

            // console.log('getOwnership', { result });

            return result;
        } catch {
            return null;
        }
    }

    public async transferOwnership(moduleName: string, address: string) {
        // console.log('transferOwnership', { moduleName, address });

        const userId = this._nearAccount.accountId;

        await this._contract.transferOwnership({
            mod_name: moduleName,
            oldUserId: userId,
            newUserId: address
        });

        // console.log('transferOwnership', { result: 'done' });
    }

    public async addContextId(moduleName: string, contextId: string) {

        // console.log('addContextId', { moduleName, contextId });

        const userId = this._nearAccount.accountId;
        await this._contract.addContextId({
            mod_name: moduleName,
            contextId: contextId,
            owner: userId
        });

        // console.log('addContextId', { result: 'done' });
    }

    public async removeContextId(moduleName: string, contextId: string) {
        // console.log('removeContextId', { moduleName, contextId });

        const userId = this._nearAccount.accountId;
        await this._contract.removeContextId({
            mod_name: moduleName,
            contextId: contextId,
            owner: userId
        });

        // console.log('removeContextId', { result: 'done' });
    }
}