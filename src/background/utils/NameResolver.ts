
import GlobalConfigService from '../services/GlobalConfigService';

export default class NameResolver {
    private _devConfig: { hostnames: { [key: string]: { [key: string]: string } }, scripts: { [key: string]: { [key: string]: string } } } = null;
    private _rootUrl: string = null;
    private _globalConfigService = new GlobalConfigService();

    public async resolve(name: string, version: string): Promise<string> {
        return await this._resolveByDevConfig(name, version);
    }

    private async _resolveByDevConfig(name: string, version: string): Promise<string> {
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

        if (!this._devConfig.scripts[name] || !this._devConfig.scripts[name][version]) return null;

        const uri = this._rootUrl + '/' + this._devConfig.scripts[name][version];

        return uri;
    }
}