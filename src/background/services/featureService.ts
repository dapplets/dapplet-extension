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
        let featuresDto: ManifestDTO[] = [];

        const config = await this._siteConfigRepository.getById(hostname);
        const featuresBranches = await this._registryAggregator.getFeatures(hostname);

        for (const name in featuresBranches) {
            const branch = featuresBranches[name][0]; // ToDo: select branch
            const versions = await this._registryAggregator.getVersions(name, branch);
            const lastVersion = versions[versions.length - 1]; // ToDo: select version
            const dto: ManifestDTO = await this._moduleManager.loadManifest(name, branch, lastVersion) as any;

            dto.isActive = config.activeFeatures[name] && config.activeFeatures[name].isActive;

            featuresDto.push(dto);
        }

        return featuresDto;
    }

    async activateFeature(name, version, hostname): Promise<void> {
        const config = await this._siteConfigRepository.getById(hostname);

        config.activeFeatures[name] = {
            version,
            isActive: true
        };

        await this._siteConfigRepository.update(config);

        // ToDo: fire activate event to inpage module
    }

    async deactivateFeature(name, version, hostname): Promise<void> {
        const config = await this._siteConfigRepository.getById(hostname);

        config.activeFeatures[name] = {
            version,
            isActive: false
        };

        await this._siteConfigRepository.update(config);

        // ToDo: fire deactivate event to inpage module
    }

    public async getActiveModulesByHostname(hostname: string) {
        const featureNames = await this.getFeaturesByHostname(hostname);
        const activeFeatureNames = featureNames.filter(f => f.isActive === true);
        const loadedModules = await this.getModulesWithDeps(activeFeatureNames);
        return loadedModules;
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