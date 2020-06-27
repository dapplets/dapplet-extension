import { Registry, StorageRef } from './registry';
import { DEFAULT_BRANCH_NAME, ModuleTypes } from '../../common/constants';
import Manifest from '../models/manifest';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { compare, rcompare } from 'semver';

type DevManifest = {
    name: string;
    version: string;
    description: string;
    main: string;

    dapplets: {
        name?: string;
        branch: string;
        type: ModuleTypes;
        title: string;
        icon?: string;
        interfaces?: {
            [name: string]: string
        };
        dependencies?: {
            [name: string]: string
        }
    }
}

export class DevRegistry implements Registry {

    private _rootUrl: string;
    public isAvailable: boolean = true;
    public error: string = null;

    private _devConfig: {
        contextIds: { [moduleName: string]: string[] },
        interfaces: { [moduleName: string]: string[] },
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
            const modules = this._fetchModulesByContextId([contextId]);
            for (const moduleName of modules) {
                if (!this._devConfig.modules[moduleName]) continue;
                const versions = Object.keys(this._devConfig.modules[moduleName][DEFAULT_BRANCH_NAME] || {});
                if (versions.length === 0) continue;
                const lastVersion = versions.sort(rcompare)[0];
                const url = this._devConfig.modules[moduleName][DEFAULT_BRANCH_NAME][lastVersion];
                const info = await this._loadModuleAndVersionInfo(url);
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
        mi.name = dm.dapplets.name || dm.name;
        mi.title = dm.dapplets.title;
        mi.type = dm.dapplets.type;
        mi.description = dm.description;
        mi.icon = dm.dapplets.icon ? {
            hash: null,
            uris: [new URL(dm.dapplets.icon, new URL(manifestUri, this._rootUrl).href).href]
        } : null;
        mi.interfaces = Object.keys(dm.dapplets.interfaces || {});

        const vi = new VersionInfo();
        vi.name = dm.dapplets.name || dm.name;
        vi.branch = dm.dapplets.branch;
        vi.version = dm.version;
        vi.type = dm.dapplets.type;
        vi.dist = dm.main ? {
            hash: null,
            uris: [new URL(dm.main, new URL(manifestUri, this._rootUrl).href).href]
        } : null;
        vi.dependencies = dm.dapplets.dependencies;
        vi.interfaces = dm.dapplets.interfaces;

        return { module: mi, version: vi };
    }

    private async _loadManifest(uri: string): Promise<DevManifest> {
        const manifestUri = new URL(uri, this._rootUrl).href;
        const response = await fetch(manifestUri);
        const manifest = await response.json() as DevManifest;
        return manifest;
    }

    private _fetchModulesByContextId(contextIds: string[]): string[] {
        const result = [];

        for (const contextId of contextIds) {
            for (const moduleName in this._devConfig.contextIds) {
                const moduleContextIds = this._devConfig.contextIds[moduleName] || [];
                if (moduleContextIds.indexOf(contextId) !== -1) {
                    result.push(moduleName);
                    result.push(...this._fetchModulesByContextId([moduleName]));
                    result.push(...this._fetchModulesByContextId(this._devConfig.interfaces && this._devConfig.interfaces[moduleName] || []));
                }
            }
        }

        return result;
    }
}