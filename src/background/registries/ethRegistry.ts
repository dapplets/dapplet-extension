import { Registry, StorageRef } from './registry';
import abi from './ethRegistryAbi';
import * as ethers from "ethers";
import * as semver from 'semver';
import ModuleInfo from '../models/moduleInfo';
import { ModuleTypes, DEFAULT_BRANCH_NAME } from '../../common/constants';
import VersionInfo from '../models/versionInfo';
import { getBitFromHex, mergeDedupe, typeOfUri, UriTypes } from '../../common/helpers';

type EthStorageRef = {
    hash: string; // bytes32
    uris: string[]; // bytes[]
}

type EthModuleInfo = {
    moduleType: number; // uint8
    name: string; // string
    title: string; // string
    description: string; // string
    icon: EthStorageRef;
    owner: string; // bytes32
    interfaces: string[]; // string[]
    flags: ethers.BigNumber; // uint 
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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

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
        if (!contextIds || contextIds.length === 0) return {};
        if (!users || users.length === 0) return {};

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

            const contract = await this._contractPromise;
            const moduleInfosByCtx: EthModuleInfo[][] = await contract.getModuleInfoBatch(contextIds, users, 0);
            this.isAvailable = true;
            this.error = null;

            const result = Object.fromEntries(moduleInfosByCtx.map((modules, i) => {
                const ctx = contextIds[i];
                const mis = modules.map(m => this._convertFromEthMi(m));

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
            const mi = this._convertFromEthMi(m);
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
                .map(x => {
                    const major = parseInt('0x' + x[0] + x[1]);
                    const minor = parseInt('0x' + x[2] + x[3]);
                    const patch = parseInt('0x' + x[4] + x[5]);
                    return `${major}.${minor}.${patch}`;
                });
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
            const vi = this._convertFromEthVi(response.dto, response.moduleType, { name, branch });
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

    public async getAllDevModules({ users }: { users: string[] }): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]> {
        const contract = await this._contractPromise;
        const devModules: EthModuleInfo[][] = await Promise.all(users.map(x => contract.getModuleInfoByOwner(x)));
        const modules = mergeDedupe(devModules).map(x => this._convertFromEthMi(x));
        const modulesWithLastVersions = await Promise.all(
            modules.map(a => this.getVersionNumbers(a.name, DEFAULT_BRANCH_NAME) // ToDo: fetch another branches
                .then(b => b.length > 0 ? b[b.length - 1] : null)
                .then(c => (c !== null) ? contract.getVersionInfo(a.name, DEFAULT_BRANCH_NAME, semver.major(c), semver.minor(c), semver.patch(c)).catch(() => null) : null)
                .then(d => d ? this._convertFromEthVi(d.dto, d.moduleType, { name: a.name, branch: DEFAULT_BRANCH_NAME }) : null)
                .then(e => ({ module: a, versions: (e) ? [e] : [] }))
            )
        );
        return modulesWithLastVersions;
    }

    public async addModule(module: ModuleInfo, version: VersionInfo): Promise<void> {
        const contract = await this._contractPromise;
        const isModuleExist = await contract.getModuleInfoByName(module.name).then(x => !!x).catch(() => false);

        if (isModuleExist && !version) throw new Error("A module with such name already exists.");

        if (!isModuleExist) {
            const mi = this._convertToEthMi(module);
            const vis = version ? [this._convertToEthVi(version)] : [];
            const tx = await contract.addModuleInfo(module.contextIds, mi, vis);
            await tx.wait();
        } else {
            const vi = this._convertToEthVi(version);
            const tx = await contract.addModuleVersion(module.name, vi);
            await tx.wait();
        }
    }

    // ToDo: use getModuleInfoByName instead
    public async getOwnership(moduleName: string) {
        try {
            const contract = await this._contractPromise;
            const mi = await contract.getModuleInfoByName(moduleName);
            return mi.owner;
        } catch {
            return null;
        }
    }

    public async transferOwnership(moduleName: string, newAccount: string, oldAccount: string) {
        const contract = await this._contractPromise;
        const devModules: EthModuleInfo[] = await contract.getModuleInfoByOwner(oldAccount);
        const oldOwnerArrIdx = devModules.findIndex(x => x.name === moduleName);
        const tx = await contract.transferOwnership(moduleName, newAccount, oldOwnerArrIdx);
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

    public async editModuleInfo(module: ModuleInfo): Promise<void> {
        const contract = await this._contractPromise;
        const ethMi = this._convertToEthMi(module);
        const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ethMi.name));
        const moduleIdx = await contract.moduleIdxs(key);
        await contract.editModuleInfo(moduleIdx, ethMi.title, ethMi.description, ethMi.icon);
    }

    private _convertFromEthMi(m: EthModuleInfo): ModuleInfo {
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
        mi.interfaces = m.interfaces;
        mi.registryUrl = this.url;
        mi.isUnderConstruction = getBitFromHex(m.flags.toHexString(), 0);
        return mi;
    }

    private _convertFromEthVi(dto: EthVersionInfoDto, moduleType: number, { name, branch }: { name: string, branch: string }): VersionInfo {
        const vi = new VersionInfo();
        vi.registryUrl = this.url;
        vi.name = name;
        vi.branch = branch;
        vi.version = `${dto.major}.${dto.minor}.${dto.patch}`;
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
        return vi;
    }

    private _convertToEthMi(module: ModuleInfo): EthModuleInfo {
        return {
            name: module.name,
            moduleType: parseInt(Object.entries(moduleTypesMap).find(([k, v]) => v === module.type)[0]),
            flags: ethers.BigNumber.from('0x00'),
            title: module.title,
            description: module.description,
            icon: module.icon ? {
                hash: module.icon.hash,
                uris: module.icon.uris.map(u => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(u)))
            } : {
                hash: ZERO_BYTES32,
                uris: []
            },
            owner: ZERO_ADDRESS,
            interfaces: module.interfaces || []
        };
    }

    private _convertToEthVi(version: VersionInfo): EthVersionInfoDto {
        return {
            branch: version.branch,
            major: semver.major(version.version),
            minor: semver.minor(version.version),
            patch: semver.patch(version.version),
            binary: version.dist ? {
                hash: version.dist.hash,
                uris: version.dist.uris.map(u => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(u)))
            } : {
                hash: ZERO_BYTES32,
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
    }
}