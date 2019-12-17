import ManifestDTO from '../dto/manifestDTO';
import SiteConfigBrowserStorage from '../browserStorages/siteConfigBrowserStorage';
import ModuleManager from '../utils/moduleManager';
import { RegistryAggregator } from '../registries/registryAggregator';
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import * as extension from 'extensionizer';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigBrowserStorage();
    private _registryAggregator = new RegistryAggregator();
    private _storageAggregator = new StorageAggregator();
    private _moduleManager = new ModuleManager(this._registryAggregator, this._storageAggregator);

    async getFeaturesByHostnames(hostnames: string[]): Promise<ManifestDTO[]> {
        if (!hostnames || hostnames.length === 0) return [];

        const featuresDto: ManifestDTO[] = [];

        const featuresHostnames = await this._registryAggregator.getFeatures(hostnames);

        for (const hostname in featuresHostnames) {
            const featuresBranches = featuresHostnames[hostname];
            const names = Object.getOwnPropertyNames(featuresBranches);
            for (let i = 0; i < names.length; i++) {
                const name = names[i];
                const branch = featuresBranches[name][0]; // ToDo: select branch
                const versions = await this._registryAggregator.getVersions(name, branch);
                const lastVersion = versions[versions.length - 1]; // ToDo: select version

                const feature = featuresDto.find(f => f.name === name && f.branch === branch && f.version === lastVersion);
                if (!feature) {
                    const dto: ManifestDTO = await this._moduleManager.loadManifest(name, branch, lastVersion) as any;
                    const config = await this._siteConfigRepository.getById(hostname); // ToDo: which contextId should we compare?
                    dto.isActive = config.activeFeatures[name]?.isActive || false;
                    dto.order = i;
                    if (!dto.hostnames) dto.hostnames = [];
                    dto.hostnames.push(hostname);
                    featuresDto.push(dto);
                } else {
                    if (!feature.hostnames) feature.hostnames = [];
                    feature.hostnames.push(hostname);
                }
            }
        }

        return featuresDto;
    }

    async activateFeature(name, version, hostname): Promise<void> {
        const config = await this._siteConfigRepository.getById(hostname);
        const featuresBranches = await this._registryAggregator.getFeatures([hostname]);
        const order = Object.getOwnPropertyNames(featuresBranches).findIndex(f => f === name);

        config.activeFeatures[name] = {
            version,
            isActive: true
            // ToDo: get a order from the config
        };

        await this._siteConfigRepository.update(config);

        extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            var activeTab = tabs[0];
            extension.tabs.sendMessage(activeTab.id, {
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

        extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            var activeTab = tabs[0];
            extension.tabs.sendMessage(activeTab.id, {
                type: "FEATURE_DEACTIVATED",
                payload: { name, version, branch: "default" } // ToDo: fix branch
            });
        });
    }

    public async getActiveModulesByHostnames(hostnames: string[]) {
        const featureNames = await this.getFeaturesByHostnames(hostnames);
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