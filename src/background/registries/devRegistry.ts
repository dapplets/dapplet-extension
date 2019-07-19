import { Registry } from './registry';
import GlobalConfigService from '../services/GlobalConfigService';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export class DevRegistry implements Registry {
    private _devConfig: {
        hostnames: { [hostname: string]: { [name: string]: string } },
        modules: { [name: string]: { [branch: string]: string } }
    } = null;

    private _rootUrl: string = null;

    private _globalConfigService = new GlobalConfigService();

    public async getVersions(name: string, branch: string): Promise<string[]> {
        await this._cacheDevConfig();
        const versions = Object.keys(this._devConfig.modules[name][branch]);
        return versions;
    }

    public async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        await this._cacheDevConfig();
        const { modules } = this._devConfig;

        if (!modules || !modules[name] || !modules[name][branch] || !modules[name][branch][version]) {
            throw new Error(`Can not find ${name}#${branch}@${version} inside Dev Config`);
        };

        const uri = new URL(this._devConfig.modules[name][branch][version], this._rootUrl).href;

        return [uri];
    }

    public async getActiveFeatures(hostname: string): Promise<{ [name: string]: string[]; }> {
        await this._cacheDevConfig();
        const { hostnames } = this._devConfig;
        const activeFeatures = {};

        if (!hostnames || !hostnames[hostname]) {
            return activeFeatures;
        }

        Object.keys(hostnames).forEach(name => {
            // ToDo: add parsing of other branches
            activeFeatures[name] = [DEFAULT_BRANCH_NAME];
        });

        return activeFeatures;
    }

    private async _cacheDevConfig() {
        if (this._devConfig == null || this._rootUrl == null) {
            const { devConfigUrl } = await this._globalConfigService.get();
            if (!devConfigUrl) return null;

            this._rootUrl = new URL(devConfigUrl).origin;

            const response = await fetch(devConfigUrl, { cache: 'no-store' });
            if (!response.ok) {
                console.error("Cannot load dev config");
                return;
            }
            const text = await response.text();

            this._devConfig = JSON.parse(text);
        }
    }
}