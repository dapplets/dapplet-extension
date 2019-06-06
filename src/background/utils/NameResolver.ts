
import GlobalConfigService from '../services/GlobalConfigService';

export default class NameResolver {
    private _globalConfigService = new GlobalConfigService();
    
    public async resolve(name: string, version: string): Promise<string> {
        return await this._resolveByDevConfig(name, version);
    }

    private async _resolveByDevConfig(name: string, version: string): Promise<string> {
        const { devConfigUrl } = await this._globalConfigService.get();
        if (!devConfigUrl) return null;

        const response = await fetch(devConfigUrl + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
        if (!response.ok) {
            console.error("Cannot load dev config");
            return;
        }
        const text = await response.text();

        const config: { hostnames: { [key: string]: { [key: string]: string } }, scripts: { [key: string]: { [key: string]: string } } } = JSON.parse(text);

        if (!config.scripts[name] || !config.scripts[name][version]) return null;

        const rootUrl = devConfigUrl.substring(0, devConfigUrl.lastIndexOf('/'));

        const uri = rootUrl + '/' + config.scripts[name][version];

        return uri;
    }
}