import { Registry, HashUris } from './registry';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';
import Manifest from '../models/manifest';

export class DevRegistry implements Registry {

    private _rootUrl: string;
    public isAvailable: boolean = true;
    public error: string = null;

    private _devConfig: {
        hostnames: { [hostname: string]: { [name: string]: string } },
        modules: { [name: string]: { [branch: string]: string } }
    } = null;

    constructor(public url: string) {
        if (!url) throw new Error("Config Url is required");
        this._rootUrl = new URL(this.url).origin;
    }

    public async getVersions(name: string, branch: string): Promise<string[]> {
        await this._cacheDevConfig();
        const branches = this._devConfig.modules[name];
        if (!branches || !branches[branch]) return [];
        const versions = Object.keys(branches[branch]);
        return versions;
    }

    public async resolveToManifest(name: string, branch: string, version: string): Promise<Manifest> {
        await this._cacheDevConfig();
        const { modules } = this._devConfig;

        if (!modules || !modules[name] || !modules[name][branch] || !modules[name][branch][version]) {
            return null;
        };

        const manifestUri = new URL(this._devConfig.modules[name][branch][version], this._rootUrl).href;
        const response = await fetch(manifestUri);
        const manifest = await response.json() as Manifest;
        const distUri = new URL(manifest.dist as string, manifestUri).href;
        manifest.dist = {
            hash: null,
            uris: [distUri]
        }

        return manifest;
    }

    public async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        await this._cacheDevConfig();

        if (!this._devConfig.hostnames) {
            return {};
        }

        const featureHostnames = {};

        for (const hostname of hostnames) {
            featureHostnames[hostname] = {};
            if (this._devConfig.hostnames[hostname]) {
                Object.keys(this._devConfig.hostnames[hostname]).forEach(name => {
                    // ToDo: add parsing of other branches
                    featureHostnames[hostname][name] = [DEFAULT_BRANCH_NAME];
                });
            }
        }

        return featureHostnames;
    }

    public async getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]> {
        await this._cacheDevConfig();

        const modules = [];

        for (const name in this._devConfig.modules) {
            for (const branch in this._devConfig.modules[name]) {
                const versions = Object.keys(this._devConfig.modules[name][branch]);
                const lastVersion = versions[versions.length - 1]; // ToDo: is it correct?
                modules.push({ name, branch, version: lastVersion });
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

    public async addModule(name: string, branch: string, version: string, manifest: Manifest): Promise<void> {
        throw new Error("Development Registry doesn't support a module deployment.");
    }

    public async hashToUris(hash: string): Promise<HashUris> {
        throw Error('ToDo: TestRegistry.hashToUris is not implemented.');
    }

    public async getOwnership(moduleName: string): Promise<string> {
        return null;
    }

    public async transferOwnership(moduleName: string, address: string): Promise<void> {
        return;
    }

    public async addLocation(moduleName: string, location: string) {
        return;
    }

    public async removeLocation(moduleName: string, location: string) {
        return;
    }
}