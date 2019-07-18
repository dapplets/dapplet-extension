
import GlobalConfigService from '../services/GlobalConfigService';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export default class NameResolver {
    private _devConfig: { hostnames: { [key: string]: { [key: string]: string } }, modules: { [key: string]: { [key: string]: string } } } = null;
    private _rootUrl: string = null;
    private _globalConfigService = new GlobalConfigService();

    public async resolve(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<string> {
        return await this._resolveByDevConfig(name, version, branch);
    }

    public async getVersionsByName(name: string, branch: string = DEFAULT_BRANCH_NAME) : Promise<string[]> {
        await this._cacheDevConfig();
        const versions = Object.keys(this._devConfig.modules[name][branch]);
        return versions;
    }


    private async _resolveByDevConfig(name: string, version: string, branch: string = DEFAULT_BRANCH_NAME): Promise<string> {
        await this._cacheDevConfig();

        if (!this._devConfig.modules[name] || !this._devConfig.modules[name][branch] || !this._devConfig.modules[name][branch][version]) return null;

        const uri = this._rootUrl + '/' + this._devConfig.modules[name][branch][version];

        return uri;
    }

    private async _cacheDevConfig() {
        if (this._devConfig == null || this._rootUrl == null) {
            const { devConfigUrl } = await this._globalConfigService.get();
            if (!devConfigUrl) return null;

            this._rootUrl = devConfigUrl.substring(0, devConfigUrl.lastIndexOf('/'));

            const response = await fetch(devConfigUrl + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
            if (!response.ok) {
                console.error("Cannot load dev config");
                return;
            }
            const text = await response.text();

            this._devConfig = JSON.parse(text);
        }
    }
}