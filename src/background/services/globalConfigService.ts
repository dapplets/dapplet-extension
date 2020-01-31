import GlobalConfigBrowserStorage from '../browserStorages/globalConfigBrowserStorage';
import { GlobalConfig } from '../models/globalConfig';

export default class GlobalConfigService {
    private _globalConfigRepository = new GlobalConfigBrowserStorage();
    private _configId: string = 'default';

    async get(): Promise<GlobalConfig> {
        let config = await this._globalConfigRepository.getById(this._configId);
        if (!config) await this.resetConfig();
        config = await this._globalConfigRepository.getById(this._configId);

        return config;
    }

    async set(config: GlobalConfig): Promise<void> {
        await this._globalConfigRepository.update(config);
    }

    async resetConfig(): Promise<void> {
        const config = new GlobalConfig();
        config.id = this._configId;
        config.registries = [{
            url: "https://test.dapplets.org/dapplet-base",
            isDev: false
        }];

        await this._globalConfigRepository.deleteById(this._configId);
        await this._globalConfigRepository.create(config);
    }

    async getRegistries() {
        const config = await this.get();
        return config.registries;
    }

    async addRegistry(url: string, isDev: boolean) {
        const config = await this.get();
        if (config.registries.find(r => r.url === url)) return;

        const response = await fetch(url);
        if (response.ok || !isDev) { // ToDo: check prod registry correctly
            config.registries.push({ url, isDev });
            await this.set(config);
        } else {
            throw Error('The registry is not available.');
        }
    }

    async removeRegistry(url: string) {
        const config = await this.get();
        config.registries = config.registries.filter(r => r.url !== url);
        await this.set(config);
    }

    async getIntro() {
        const config = await this.get();
        return config.intro;
    }

    async setIntro(intro: any) {
        const config = await this.get();
        Object.entries(intro).forEach(([key, value]) => config.intro[key] = value);
        await this.set(config);
    }
}