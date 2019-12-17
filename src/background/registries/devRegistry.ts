import { Registry } from './registry';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export class DevRegistry implements Registry {

    constructor(public registryUrl: string) {
        if (!registryUrl) throw new Error("Config Url is required");
    }

    private _devConfig: {
        hostnames: { [hostname: string]: { [name: string]: string } },
        modules: { [name: string]: { [branch: string]: string } }
    } = null;

    private _rootUrl: string = null;

    public async getVersions(name: string, branch: string): Promise<string[]> {
        await this._cacheDevConfig();
        const versions = Object.keys(this._devConfig.modules[name][branch]);
        return versions;
    }

    public async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        await this._cacheDevConfig();
        const { modules } = this._devConfig;

        if (!modules || !modules[name] || !modules[name][branch] || !modules[name][branch][version]) {
            return [];
        };

        const uri = new URL(this._devConfig.modules[name][branch][version], this._rootUrl).href;

        return [uri];
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

    private async _cacheDevConfig() {
        if (this._devConfig == null || this._rootUrl == null) {
            this._rootUrl = new URL(this.registryUrl).origin;

            const response = await fetch(this.registryUrl, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error("Cannot load dev config");
            }
            const text = await response.text();

            this._devConfig = JSON.parse(text);
        }
    }
}