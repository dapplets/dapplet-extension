import { Registry } from './registry';
import { DevRegistry } from './devRegistry';
import GlobalConfigService from '../services/globalConfigService';

export class RegistryManager implements Registry {
    private _registries: Registry[] = [];

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();
        const versions: string[] = [];

        for (const registry of this._registries) {
            // ToDo: optimize this loop
            const registryVersions = await registry.getVersions(name, branch);
            registryVersions.forEach(v => !versions.includes(v) && versions.push(v));
        }

        return versions;
    }

    async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        await this._initRegistries();
        const uris: string[] = [];

        for (const registry of this._registries) {
            // ToDo: optimize this loop
            const registryUris = await registry.resolveToUri(name, branch, version);
            registryUris.forEach(u => !uris.includes(u) && uris.push(u));
        }

        return uris;
    }

    async getFeatures(hostname: string): Promise<{ [name: string]: string[]; }> {
        await this._initRegistries();

        const features: { [name: string]: string[]; } = {};

        for (const registry of this._registries) {
            const registryFeatures = await registry.getFeatures(hostname);
            for (const name in registryFeatures) {
                // ToDo: filter features by version rules
                // ToDo: upgrade features here?
                if (registryFeatures.hasOwnProperty(name)) {
                    features[name] = registryFeatures[name];
                }
            }
        }

        return features;
    }

    private async _initRegistries() {
        // Do not initilize registries twice
        if (this._registries.length > 0) return;

        const globalConfigService = new GlobalConfigService();

        // ToDo: fetch LocalConfig
        const { devConfigUrl } = await globalConfigService.get();

        // Add Dev Registry
        if (devConfigUrl) this._registries.push(new DevRegistry(devConfigUrl));

        // ToDo: Add Prod Registry
    }
}