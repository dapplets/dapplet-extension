import GlobalConfigBrowserStorage from '../browserStorages/globalConfigBrowserStorage';
import { GlobalConfig } from '../models/globalConfig';
import { typeOfUri, UriTypes } from '../../common/helpers';
import { SwarmModuleStorage } from '../moduleStorages/swarmModuleStorage';
import { browser } from "webextension-polyfill-ts";
import { generateGuid } from '../../common/helpers';
import SiteConfig from '../models/siteConfig';

export default class GlobalConfigService {
    private _globalConfigRepository = new GlobalConfigBrowserStorage();
    private _defaultConfigId: string = 'default';

    async get(): Promise<GlobalConfig> {
        const configs = await this._globalConfigRepository.getAll();
        const config = configs.find(x => x.isActive) ?? configs.find(x => x.id === this._defaultConfigId);
        return config ?? this.getInitialConfig();
    }

    async set(config: GlobalConfig): Promise<void> {
        await this._globalConfigRepository.update(config);
    }

    async getProfiles(): Promise<{ id: string, isActive: boolean }[]> {
        const configs = await this._globalConfigRepository.getAll();
        if (configs.length === 0) configs.push(this.getInitialConfig());
        if (!configs.find(x => x.isActive)) configs.find(x => x.id === this._defaultConfigId).isActive = true;
        return configs.map(x => ({ id: x.id, isActive: x.isActive }));
    }

    async setActiveProfile(profileId: string) {
        const configs = await this._globalConfigRepository.getAll();

        for (const config of configs) {
            // activate new config
            if (config.id === profileId) {
                config.isActive = true;
                await this._globalConfigRepository.update(config);
            }

            // deactivate old configs
            if (config.id !== profileId && config.isActive === true) {
                config.isActive = false;
                await this._globalConfigRepository.update(config);
            }
        }
    }

    async copyProfile(targetProfileId: string, sourceProfileId: string) {
        const existingConfig = await this._globalConfigRepository.getById(targetProfileId);
        if (existingConfig) throw new Error(`Profile "${targetProfileId}" already exists.`);

        const config = await this._globalConfigRepository.getById(sourceProfileId);
        if (!config) throw new Error(`Profile "${sourceProfileId}" doesn't exist.`);

        config.id = targetProfileId;
        config.isActive = false;

        await this._globalConfigRepository.create(config);
    }

    async importProfile(url: string): Promise<string> {
        const swarmStorage = new SwarmModuleStorage();
        const arr = await swarmStorage.getResource(url);
        const json = new TextDecoder("utf-8").decode(new Uint8Array(arr));
        const config = JSON.parse(json);

        let id = config.id;
        while (await this._globalConfigRepository.getById(id)) {
            id += ' Copy';
        }

        config.id = id;

        await this._globalConfigRepository.create(config);

        return config.id;
    }

    async exportProfile(profileId: string): Promise<string> {
        const config = await this._globalConfigRepository.getById(profileId);
        const json = JSON.stringify(config);
        const blob = new Blob([json], { type: "application/json" });
        const swarmStorage = new SwarmModuleStorage();
        const url = await swarmStorage.save(blob);
        return url;
    }

    async createShareLink(profileId: string): Promise<string> {
        const bzzLink = await this.exportProfile(profileId);
        const absoluteLink = 'https://swarm.dapplets.org/files/' + bzzLink.replace('bzz://', '');
        const shareLink = `https://github.com/dapplets/dapplet-extension/releases/latest/download/dapplet-extension.zip?config=${absoluteLink}`;
        return shareLink;
    }

    getInitialConfig(): GlobalConfig {
        const config = new GlobalConfig();
        config.id = this._defaultConfigId;
        config.isActive = true;
        config.registries = [
            { url: "dev-1619784199964-4356216", isDev: false, isEnabled: true },
            { url: "dapplet-base.eth", isDev: false, isEnabled: false }
        ];
        config.devMode = false;
        config.trustedUsers = [
            { account: "buidl.testnet" },
            { account: "nik3ter.testnet" },
            { account: "0x692a4d7B7BE2dc1623155E90B197a82D114a74f3" },
            { account: "0x9126d36880905fcb9e5f2a7f7c4f19703d52bc62" }
        ];
        config.userSettings = {};
        config.providerUrl = 'https://rinkeby.infura.io/v3/e2b99cd257a5468d94749fa32f75fc3c';
        config.walletsUsage = {};
        config.identityContract = '0xf6b3a0B20281796D465bB8613e233BE30be07084';
        config.popupInOverlay = false;
        config.autoBackup = true;
        config.errorReporting = true;
        config.userAgentId = generateGuid();
        config.userAgentName = '';
        config.hostnames = {};

        return config;
    }

    async getRegistries() {
        const config = await this.get();
        const registries = config.registries.map(x => ({ ...x, isEnabled: (x.isEnabled === undefined) ? true : x.isEnabled }));
        return registries;
    }

    async addRegistry(url: string, isDev: boolean) {
        const isEthAddress = typeOfUri(url) === UriTypes.Ethereum;
        const isEnsAddress = typeOfUri(url) === UriTypes.Ens;
        const isHttpAddress = typeOfUri(url) === UriTypes.Http;
        const isNearAddress = typeOfUri(url) === UriTypes.Near;

        if (!isEthAddress && !isEnsAddress && !isHttpAddress && !isNearAddress) throw new Error("Unsupported URI type");
        if (isDev && !isHttpAddress) throw new Error("Only HTTP(S) links are supported for development servers");
        if (!isDev && (!isEthAddress && !isEnsAddress && !isNearAddress)) throw new Error("A public registry must have a valid Ethereum, ENS or NEAR Protocol address");

        const config = await this.get();
        if (config.registries.find(r => r.url === url)) return;

        // Dev registries are enabled by default
        const isEnabled = isDev ? true : false;

        if (isEthAddress || isEnsAddress || isNearAddress) {
            // ToDo: fix it
            // if (isEnsAddress) {
            //     const signer = new WalletConnectSigner();
            //     const address = await signer.resolveName(url);
            //     if (!address) throw new Error("Can not resolve the ENS name");
            // }

            config.registries.push({ url, isDev, isEnabled: isEnabled });
            await this.set(config);
        } else {
            const response = await fetch(url);
            if (response.ok || !isDev) { // ToDo: check prod registry correctly
                config.registries.push({ url, isDev, isEnabled: isEnabled });
                await this.set(config);
            } else {
                throw Error('The registry is not available.');
            }
        }
    }

    async removeRegistry(url: string) {
        return this.updateConfig(c => c.registries = c.registries.filter(r => r.url !== url));
    }

    async enableRegistry(url: string) {
        const config = await this.get();
        const registry = config.registries.find(x => x.url === url);
        registry.isEnabled = true;

        // only one production registry can be enabled
        if (!registry.isDev) {
            config.registries.filter(x => x.url !== url && !x.isDev)
                .forEach(x => x.isEnabled = false);
        }

        return this.set(config);
    }

    async disableRegistry(url: string) {
        return this.updateConfig(c => c.registries.find(x => x.url === url).isEnabled = false);
    }

    async getIntro() {
        const config = await this.get();
        return config.intro;
    }

    async setIntro(intro: any) {
        return this.updateConfig(c => Object.entries(intro).forEach(([key, value]) => c.intro[key] = value));
    }

    async getDevMode() {
        const config = await this.get();
        return config.devMode;
    }

    async setDevMode(isActive: boolean) {
        return this.updateConfig(c => c.devMode = isActive);
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

        const isEthAddress = typeOfUri(account) === UriTypes.Ethereum;
        const isEnsAddress = typeOfUri(account) === UriTypes.Ens;
        const isNearAddress = typeOfUri(account) === UriTypes.Near;

        if (!isEthAddress && !isEnsAddress && !isNearAddress) throw Error('User account must be valid Ethereum or NEAR Protocol address');

        // ToDo: fix it
        // if (isEnsAddress) {
        //     const provider = await this.getEthereumProvider();
        //     const signer = new WalletConnectSigner(provider);
        //     const address = await signer.resolveName(account);
        //     if (!address) throw new Error("Can not resolve the ENS name");
        // }

        config.trustedUsers.push({ account: account });
        await this.set(config);
    }

    async removeTrustedUser(account: string) {
        return this.updateConfig(c => c.trustedUsers = c.trustedUsers.filter(r => r.account !== account));
    }

    async getUserSettings(moduleName: string, key: string) {
        const config = await this.get();
        if (!config.userSettings[moduleName]) return undefined;
        return config.userSettings[moduleName][key];
    }

    async setUserSettings(moduleName: string, key: string, value: any) {
        const config = await this.get();
        if (!config.userSettings[moduleName]) config.userSettings[moduleName] = {};
        config.userSettings[moduleName][key] = value;
        await this.set(config);
    }

    async getAllUserSettings(moduleName: string) {
        const config = await this.get();
        return config.userSettings[moduleName] || {};
    }

    async setAllUserSettings(moduleName: string, values: any) {
        const config = await this.get();
        config.userSettings[moduleName] = values;
        await this.set(config);
    }

    async removeUserSettings(moduleName: string, key: string) {
        const config = await this.get();
        if (!config.userSettings[moduleName]) return;
        delete config.userSettings[moduleName][key];
        await this.set(config);
    }

    async clearUserSettings(moduleName: string) {
        const config = await this.get();
        if (!config.userSettings[moduleName]) return;
        delete config.userSettings[moduleName];
        await this.set(config);
    }

    async loadUserSettings(url: string) {
        const swarmStorage = new SwarmModuleStorage();
        const data = await swarmStorage.getResource(url);
        const json = new TextDecoder("utf-8").decode(new Uint8Array(data));
        const config = JSON.parse(json);
        await this.set(config);
    }

    async saveUserSettings() {
        const config = await this.get();
        const json = JSON.stringify(config);
        const blob = new Blob([json], { type: "application/json" });
        const swarmStorage = new SwarmModuleStorage();
        const url = await swarmStorage.save(blob);
        return url;
    }

    async getErrorReporting() {
        const config = await this.get();
        return config.errorReporting;
    }

    async setErrorReporting(isActive: boolean) {
        return this.updateConfig(c => c.errorReporting = isActive);
    }

    async getPopupInOverlay() {
        const config = await this.get();
        return config.popupInOverlay;
    }

    async setPopupInOverlay(isActive: boolean) {
        await this.updateConfig(c => c.popupInOverlay = isActive);
        await browser.browserAction.setPopup({ popup: (isActive) ? '' : 'popup.html' });
    }

    async getAutoBackup() {
        const config = await this.get();
        return config.autoBackup;
    }

    async setAutoBackup(isActive: boolean) {
        return this.updateConfig(c => c.autoBackup = isActive);
    }

    async setEthereumProvider(url: string) {
        await this.updateConfig(c => c.providerUrl = url);
        window.location.reload();
    }

    async getEthereumProvider() {
        return this.get().then(x => x.providerUrl);
    }

    async getWalletsUsage() {
        const config = await this.get();
        return config.walletsUsage ?? {};
    }

    async setWalletsUsage(walletsUsage: { [moduleName: string]: { [chain: string]: string } }) {
        return this.updateConfig(c => c.walletsUsage = walletsUsage);
    }

    async getIdentityContract() {
        return this.get().then(x => x.identityContract);
    }

    async setIdentityContract(address: string) {
        return this.updateConfig(c => c.identityContract = address);
    }

    async getUserAgentId() {
        return this.get().then(x => x.userAgentId);
    }

    async getUserAgentName() {
        return this.get().then(x => x.userAgentName);
    }

    async setUserAgentName(value: string) {
        return this.updateConfig(c => c.userAgentName = value);
    }

    async getSiteConfigById(id: string) {
        const globalConfig = await this.get();
        let config = globalConfig.hostnames?.[id];

        if (!config) {
            config = new SiteConfig();
            config.hostname = id;
            config.activeFeatures = {};
            config.paused = false;
        }

        return config;
    }

    async updateSiteConfig(config: SiteConfig) {
        const globalConfig = await this.get();
        if (!config.hostname) throw new Error("\"hostname\" is required in SiteConfig.");
        if (!globalConfig.hostnames) globalConfig.hostnames = {};
        globalConfig.hostnames[config.hostname] = config;
        await this.set(globalConfig);
    }
}