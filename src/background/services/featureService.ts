import ManifestDTO from '../dto/manifestDTO';
import SiteConfigRepository from '../repositories/siteConfigRepository';
import ModuleManager from '../utils/moduleManager';
import { RegistryManager } from '../registries/registryManager';
import { StorageManager } from '../storages/storageManager';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigRepository();
    private _registryManager = new RegistryManager();
    private _storageManager = new StorageManager();
    private _moduleManager = new ModuleManager(this._registryManager, this._storageManager);

    async getFeaturesByHostname(hostname: string): Promise<ManifestDTO[]> {
        let featuresDto: ManifestDTO[] = [];

        const config = await this._siteConfigRepository.getById(hostname);

        const featuresBranches = await this._registryManager.getFeatures(hostname);
        for (const name in featuresBranches) {
            const branch = featuresBranches[name][0]; // ToDo: select branch
            const versions = await this._registryManager.getVersions(name, branch);
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
        const modulesWithDeps = await this._moduleManager.resolve(modules);
        const promises = modulesWithDeps.map(m => this._moduleManager.loadModule(m.name, m.branch, m.version));
        const loadedModules = await Promise.all(promises);
        return loadedModules;
    }
}