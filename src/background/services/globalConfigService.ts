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
            url: "0xd9DA703d8b40C8e59FbAd20Bc20D61d78AAE6406",
            isDev: false
        }];
        config.devMode = false;
        config.trustedUsers = [{
            account: "0x692a4d7b7be2dc1623155e90b197a82d114a74f3"
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

        // ToDo: add Ethereum address validator
        const isEthAddress = url.indexOf('0x') !== -1;

        if (!isEthAddress) {
            const response = await fetch(url);
            if (response.ok || !isDev) { // ToDo: check prod registry correctly
                config.registries.push({ url, isDev });
                await this.set(config);
            } else {
                throw Error('The registry is not available.');
            }
        } else {
            config.registries.push({ url, isDev });
            await this.set(config);
        }
    }

    async removeRegistry(url: string) {
        this.updateConfig(c => c.registries = c.registries.filter(r => r.url !== url));
    }

    async getIntro() {
        const config = await this.get();
        return config.intro;
    }

    async setIntro(intro: any) {
        this.updateConfig(c => Object.entries(intro).forEach(([key, value]) => c.intro[key] = value));
    }

    async getDevMode() {
        const config = await this.get();
        return config.devMode;
    }

    async setDevMode(isActive: boolean) {
        this.updateConfig(c => c.devMode = isActive);
    }

    async updateConfig(callback: (config: GlobalConfig) => void) {
        const config = await this.get();
        callback(config);
        await this.set(config);
    }

    async getTrustedUsers() {
        const config = await this.get();
        return config.trustedUsers;
    }

    async addTrustedUser(account: string) {
        const config = await this.get();
        if (config.trustedUsers.find(r => r.account === account)) return;

        // ToDo: add Ethereum address validator
        const isEthAddress = account.indexOf('0x') !== -1;

        if (!isEthAddress) {
            throw Error('User account must be valid Ethereum address');
        } else {
            config.trustedUsers.push({ account: account });
            await this.set(config);
        }
    }

    async removeTrustedUser(account: string) {
        this.updateConfig(c => c.trustedUsers = c.trustedUsers.filter(r => r.account !== account));
    }
}