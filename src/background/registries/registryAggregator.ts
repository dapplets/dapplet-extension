import { Registry } from './registry';
import { DevRegistry } from './devRegistry';
import { TestRegistry } from './testRegistry';
import GlobalConfigService from '../services/globalConfigService';
import { gt } from 'semver';

export class RegistryAggregator implements Registry {
    private _registries: Registry[] = [];

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();
        const versions: string[] = [];

        for (const registry of this._registries) {
            // ToDo: optimize this loop
            const registryVersions = await registry.getVersions(name, branch);
            registryVersions.forEach(v => !versions.includes(v) && versions.push(v));
        }

        return versions.sort((a, b) => gt(a, b) ? 1 : -1);
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

    async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        await this._initRegistries();
        const features = await Promise.all(this._registries.map(r => r.getFeatures(hostnames)));
        return Object.assign({}, ...features);
    }

    public async getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]> {
        await this._initRegistries();
        const modules = await Promise.all(this._registries.map(r => r.getAllDevModules()));
        console.log(modules);
        return modules.reduce((a,b) => a.concat(b));
    }

    private async _initRegistries() {
        this._registries = [];

        const globalConfigService = new GlobalConfigService();

        // ToDo: fetch LocalConfig
        const registries = await globalConfigService.getRegistries();

        if (registries && registries.length) {
            this._registries = registries.sort((a, b) => (a.isDev === false) ? 1 : -1)
                .map(r => r.isDev ? new DevRegistry(r.url) : new TestRegistry(r.url));
        }

        // ToDo: Add Prod Registry
    }
}