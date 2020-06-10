import { Registry } from './registry';
//import { DevRegistry } from './devRegistry';
import { EthRegistry } from './ethRegistry';
import GlobalConfigService from '../services/globalConfigService';
import { compare } from 'semver';
import { mergeDedupe, typeOfUri, UriTypes } from '../../common/helpers';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';

export class RegistryAggregator {
    public isAvailable: boolean = true;
    public registries: Registry[] = [];

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();

        const versionsWithErrors = await Promise.all(this.registries.map(r => r.getVersionNumbers(name, branch).catch(Error)));
        const versionsNoErrors = versionsWithErrors.filter(x => !(x instanceof Error)) as string[][];
        const versionsNotSorted = mergeDedupe(versionsNoErrors);
        const versionsAsc = versionsNotSorted.sort(compare); // ASC sorting by semver

        return versionsAsc;
    }

    async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        await this._initRegistries();

        const uriWithErrors = await Promise.all(this.registries.map(r => r.getVersionInfo(name, branch, version).catch(Error)));
        const uriNoErrors = uriWithErrors.filter(x => !(x instanceof Error) && x !== null && x !== undefined) as VersionInfo[];
        
        if (uriNoErrors.length === 0) {
            if (uriWithErrors.length === 0) {
                throw new Error(`Could not find the manifest URI of the ${name}#${branch}@${version} module`);
            } else {
                uriWithErrors.forEach(e => {
                    throw e;
                });
            }
        }

        return uriNoErrors[0];
    }

    public async getModuleInfoWithRegistries(locations: string[], users: string[]): Promise<{ [registryUrl: string]: { [hostname: string]: ModuleInfo[] } }> {
        await this._initRegistries();
        const regFeatures = await Promise.all(this.registries.map(r => r.getModuleInfo(locations, users).then(m => ({ [r.url]: m })).catch(Error)));
        const validRegFeatures = regFeatures.filter(result => !(result instanceof Error));
        const merge: { [registryUrl: string]: { [hostname: string]: ModuleInfo[] } } = {};

        // Deep merging of regFeatures
        for (const f of validRegFeatures) {
            for (const registryUrl in f) {
                if (!merge[registryUrl]) merge[registryUrl] = {};
                for (const hostname in f[registryUrl]) {
                    if (!merge[registryUrl][hostname]) merge[registryUrl][hostname] = [];
                    for (const manifest of f[registryUrl][hostname]) {
                        merge[registryUrl][hostname].push(manifest);
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
        if (!validModules || validModules.length === 0) return [];
        const reduced = validModules.reduce((a, b) => a.concat(b));
        return reduced;
    }

    private async _initRegistries() {
        const globalConfigService = new GlobalConfigService();

        // ToDo: fetch LocalConfig
        const registries = await globalConfigService.getRegistries();

        // ToDo: optimize comparison
        if (registries.length !== this.registries.length) {
            // ToDo: Dev registries are priority
            this.registries = registries.sort((a, b) => (a.isDev === false) ? 1 : -1)
                .map(r => {
                    const uriType = typeOfUri(r.url);

                    //if (uriType === UriTypes.Http && r.isDev) return new DevRegistry(r.url);
                    //if (uriType === UriTypes.Http && !r.isDev) return new TestRegistry(r.url);
                    if (uriType === UriTypes.Ethereum) return new EthRegistry(r.url);
                });
        }
    }

    public getRegistryByUri(uri: string): Registry {
        return this.registries.find(f => f.url === uri);
    } 
}