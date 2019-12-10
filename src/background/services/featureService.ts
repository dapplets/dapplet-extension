import ManifestDTO from '../dto/manifestDTO';
import SiteConfigBrowserStorage from '../browserStorages/siteConfigBrowserStorage';
import ModuleManager from '../utils/moduleManager';
import { RegistryAggregator } from '../registries/registryAggregator';
import { StorageAggregator } from '../moduleStorages/moduleStorage';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigBrowserStorage();
    private _registryAggregator = new RegistryAggregator();
    private _storageAggregator = new StorageAggregator();
    private _moduleManager = new ModuleManager(this._registryAggregator, this._storageAggregator);

    async getFeaturesByHostname(hostname: string): Promise<ManifestDTO[]> {
        const featuresDto: ManifestDTO[] = [];

        const config = await this._siteConfigRepository.getById(hostname);
        const featuresBranches = await this._registryAggregator.getFeatures(hostname);

        const names = Object.getOwnPropertyNames(featuresBranches);
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const branch = featuresBranches[name][0]; // ToDo: select branch
            const versions = await this._registryAggregator.getVersions(name, branch);
            const lastVersion = versions[versions.length - 1]; // ToDo: select version
            const dto: ManifestDTO = await this._moduleManager.loadManifest(name, branch, lastVersion) as any;

            dto.isActive = config.activeFeatures[name]?.isActive || false;
            dto.order = i;

            featuresDto.push(dto);
        }

        return featuresDto;
    }

    async activateFeature(name, version, hostname): Promise<void> {
        const config = await this._siteConfigRepository.getById(hostname);
        const featuresBranches = await this._registryAggregator.getFeatures(hostname);
        const order = Object.getOwnPropertyNames(featuresBranches).findIndex(f => f === name);

        config.activeFeatures[name] = {
            version,
            isActive: true
            // ToDo: get a order from the config
        };

        await this._siteConfigRepository.update(config);

        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                type: "FEATURE_ACTIVATED",
                payload: { name, version, branch: "default", order } // ToDo: fix branch
            });
        });
    }

    async deactivateFeature(name, version, hostname): Promise<void> {
        const config = await this._siteConfigRepository.getById(hostname);

        config.activeFeatures[name] = {
            version,
            isActive: false
        };

        await this._siteConfigRepository.update(config);

        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                type: "FEATURE_DEACTIVATED",
                payload: { name, version, branch: "default" } // ToDo: fix branch
            });
        });
    }

    public async getActiveModulesByHostname(hostname: string) {
        const featureNames = await this.getFeaturesByHostname(hostname);
        const activeModules = featureNames.filter(f => f.isActive === true)
            .map(m => ({
                name: m.name,
                branch: m.branch,
                version: m.version,
                order: m.order
            }));
        return activeModules;
    }

    public async getModulesWithDeps(modules: { name: string, branch: string, version: string }[]) {
        if (modules.length === 0) return [];
        const modulesWithDeps = await this._moduleManager.resolveDependencies(modules);
        const promises = modulesWithDeps.map(m => this._moduleManager.loadModule(m.name, m.branch, m.version));
        const loadedModules = await Promise.all(promises);
        return loadedModules;
    }

    public async optimizeDependency(name: string, branch: string, version: string) {
        // ToDo: fix this hack
        return await this._moduleManager.optimizeDependency(name, version, branch);
    };
}