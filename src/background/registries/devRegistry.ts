import { Registry, StorageRef } from './registry';
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants';
import Manifest from '../models/manifest';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { compare, rcompare } from 'semver';

type DevManifest = {
    name: string;
    branch: string;
    version: string;
    type: ModuleTypes;
    title: string;
    description: string;
    author: string;
    icon?: string;
    dist: string;
    interfaces?: string[];

    dependencies: {
        [name: string]: string
    }
}

export class DevRegistry implements Registry {

    private _rootUrl: string;
    public isAvailable: boolean = true;
    public error: string = null;

    private _devConfig: {
        hostnames: { [hostname: string]: { [name: string]: string } },
        modules: { [name: string]: { [branch: string]: { [version: string]: string } } }
    } = null;

    constructor(public url: string) {
        if (!url) throw new Error("Config Url is required");
        this._rootUrl = new URL(this.url).origin;
    }

    public async getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }> {
        await this._cacheDevConfig();
        const result = {};

        for (const contextId of contextIds) {
            result[contextId] = [];
            for (const name in (this._devConfig.hostnames[contextId] || {})) {
                const versions = Object.keys(this._devConfig.modules[name][DEFAULT_BRANCH_NAME] || {});
                const lastVersion = versions.sort(rcompare)[0];
                const info = await this._loadModuleAndVersionInfo(this._devConfig.modules[name][DEFAULT_BRANCH_NAME][lastVersion]);
                result[contextId].push(info.module);
            }
        }

        return result;
    }

    public async getVersionNumbers(name: string, branch: string): Promise<string[]> {
        await this._cacheDevConfig();
        const branches = this._devConfig.modules[name];
        if (!branches || !branches[branch]) return [];
        const versions = Object.keys(branches[branch]);
        return versions;
    }

    public async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        await this._cacheDevConfig();
        const { modules } = this._devConfig;

        if (!modules || !modules[name] || !modules[name][branch] || !modules[name][branch][version]) {
            throw new Error(`The manifest of the module "${name}@${branch}#${version}" is not found`);
        };

        const info = await this._loadModuleAndVersionInfo(this._devConfig.modules[name][branch][version]);
        
        return info.version;
    }

    // ToDo: merge it into getModuleInfo
    public async getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]> {
        await this._cacheDevConfig();

        const modules: { module: ModuleInfo, versions: VersionInfo[] }[] = [];

        for (const name in this._devConfig.modules) {
            for (const branch in this._devConfig.modules[name]) {
                const versions = Object.keys(this._devConfig.modules[name][branch] || {});
                const lastVersion = versions.sort(rcompare)[0]; // ToDo: is it correct?
                const url = this._devConfig.modules[name][branch][lastVersion];
                try {
                const { module, version } = await this._loadModuleAndVersionInfo(url);
                modules.push({ module, versions: [version] });
                } catch (err) {
                    console.error(err);
                }
            }
        }

        return modules;
    }

    private async _cacheDevConfig() {
        //if (this.isAvailable && !this._devConfig) {
        try {
            const response = await fetch(this.url, { cache: 'no-store' });
            if (!response.ok) throw new Error(response.statusText);
            this._devConfig = await response.json();
            this.isAvailable = true;
            this.error = null;
        } catch (err) {
            this.isAvailable = false;
            this.error = err.message;
        }
        //}
    }

    public async addModule(module: ModuleInfo, version: VersionInfo): Promise<void> {
        throw new Error("Development Registry doesn't support a module deployment.");
    }

    public async getOwnership(moduleName: string): Promise<string> {
        return null;
    }

    public async transferOwnership(moduleName: string, address: string): Promise<void> {
        return;
    }

    public async addContextId(moduleName: string, location: string) {
        return;
    }

    public async removeContextId(moduleName: string, location: string) {
        return;
    }

    private async _loadModuleAndVersionInfo(manifestUri: string): Promise<{ module: ModuleInfo, version: VersionInfo }> {
        const dm = await this._loadManifest(manifestUri);

        const mi = new ModuleInfo();
        mi.name = dm.name;
        mi.title = dm.title;
        mi.type = dm.type;
        mi.description = dm.description;
        mi.icon = dm.icon ? {
            hash: null,
            uris: [new URL(dm.icon, new URL(manifestUri, this._rootUrl).href).href]
        } : null;
        mi.interfaces = dm.interfaces;

        const vi = new VersionInfo();
        vi.name = dm.name;
        vi.branch = dm.branch;
        vi.version = dm.version;
        vi.type = dm.type;
        vi.dist = {
            hash: null,
            uris: [new URL(dm.dist, new URL(manifestUri, this._rootUrl).href).href]
        }
        vi.dependencies = dm.dependencies;
        vi.interfaces = dm.interfaces;

        return { module: mi, version: vi };
    }

    private async _loadManifest(uri: string): Promise<DevManifest> {
        const manifestUri = new URL(uri, this._rootUrl).href;
        const response = await fetch(manifestUri);
        const manifest = await response.json() as DevManifest;
        return manifest;
    }
}