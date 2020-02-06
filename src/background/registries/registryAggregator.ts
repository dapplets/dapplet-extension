import { Registry } from './registry';
import { DevRegistry } from './devRegistry';
import { TestRegistry } from './testRegistry';
import GlobalConfigService from '../services/globalConfigService';
import { gt, compare } from 'semver';
import { mergeDedupe } from '../../common/helpers';

export class RegistryAggregator {
    public isAvailable: boolean = true;
    public registries: Registry[] = [];

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();

        const versionsWithErrors = await Promise.all(this.registries.map(r => r.getVersions(name, branch).catch(Error)));
        const versionsNoErrors = versionsWithErrors.filter(x => !(x instanceof Error)) as string[][];
        const versionsNotSorted = mergeDedupe(versionsNoErrors);
        const versionsAsc = versionsNotSorted.sort(compare); // ASC sorting by semver

        return versionsAsc;
    }

    async resolveToUri(name: string, branch: string, version: string): Promise<string[]> {
        await this._initRegistries();

        const uriWithErrors = await Promise.all(this.registries.map(r => r.resolveToUri(name, branch, version).catch(Error)));
        const uriNoErrors = uriWithErrors.filter(x => !(x instanceof Error)) as string[][];
        const uris = mergeDedupe(uriNoErrors);

        return uris;
    }

    async getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> {
        await this._initRegistries();
        const regFeatures = await Promise.all(this.registries.map(r => r.getFeatures(hostnames).catch(Error)));
        const validRegFeatures = regFeatures.filter(result => !(result instanceof Error));
        const merge: { [hostname: string]: { [name: string]: string[]; } } = {};

        // Deep merging of regFeatures
        for (const f of validRegFeatures) {
            for (const hostname in f) {
                if (!merge[hostname]) merge[hostname] = {};
                for (const name in f[hostname]) {
                    if (!merge[hostname][name]) merge[hostname][name] = [];
                    for (const branch of f[hostname][name]) {
                        merge[hostname][name].push(branch);
                    }
                }
            }
        }

        return merge;
    }

    public async getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]> {
        await this._initRegistries();
        const modules = await Promise.all(this.registries.map(r => r.getAllDevModules().catch((e) => e)));
        const validModules = modules.filter(result => !(result instanceof Error));
        return validModules.reduce((a, b) => a.concat(b));
    }

    private async _initRegistries() {
        const globalConfigService = new GlobalConfigService();

        // ToDo: fetch LocalConfig
        const registries = await globalConfigService.getRegistries();
        
        // ToDo: optimize comparison
        if (registries.length !== this.registries.length) {
            // ToDo: Dev registries are priority
            this.registries = registries.sort((a, b) => (a.isDev === false) ? 1 : -1)
                .map(r => r.isDev ? new DevRegistry(r.url) : new TestRegistry(r.url));
        }

        // ToDo: Add Prod Registry
    }
}