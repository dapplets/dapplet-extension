import ManifestDTO from '../dto/manifestDTO';
import SiteConfigRepository from '../repositories/siteConfigRepository';
import Manifest from '../models/manifest';
import DependencyResolver from '../utils/dependencyResolver';
import { RegistryManager } from '../registries/registryManager';
import { StorageManager } from '../storages/storageManager';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigRepository();
    private _registryManager = new RegistryManager();
    private _storageManager = new StorageManager();
    private _dependencyResolver = new DependencyResolver(this._registryManager, this._storageManager);

    async getFeaturesByHostname(hostname: string): Promise<ManifestDTO[]> {
        let featuresDto: ManifestDTO[] = [];

        const config = await this._siteConfigRepository.getById(hostname);

        const featuresBranches = await this._registryManager.getFeatures(hostname);
        for (const name in featuresBranches) {
            const branch = featuresBranches[name][0];
            const versions = await this._registryManager.getVersions(name, branch);
            const lastVersion = versions[versions.length - 1];
            const uris = await this._registryManager.resolveToUri(name, branch, lastVersion);
            const manifestUri = uris[0];
            const manifestBufferArray = await this._storageManager.getResource(manifestUri);
            const manifestJson = String.fromCharCode.apply(null, new Uint8Array(manifestBufferArray));
            const dto: ManifestDTO = JSON.parse(manifestJson);

            dto.dist = new URL(dto.dist, manifestUri).href;
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
        const modulesWithDeps = await this._dependencyResolver.resolve(modules);
        const loadedModules = await this._loadModules(modulesWithDeps);
        return loadedModules;
    }

    private async _loadModules(modules: { name: string, branch: string, version: string }[]) {
        const manifestUris = await Promise.all(modules.map(({ name, version, branch }) => this._registryManager.resolveToUri(name, branch, version)));

        const loadedModules = await Promise.all(manifestUris.map(async (manifestUri) => {
            const manifestBufferArray = await this._storageManager.getResource(manifestUri[0]);
            const manifestJson = String.fromCharCode.apply(null, new Uint8Array(manifestBufferArray));
            const manifest: Manifest = JSON.parse(manifestJson);
            const scriptUri = new URL(manifest.dist, manifestUri[0]).href;
            const resource = await this._storageManager.getResource(scriptUri);
            const script = String.fromCharCode.apply(null, new Uint8Array(resource));
            return {
                script: script,
                manifest: manifest
            };
        }));

        return loadedModules;
    }
}