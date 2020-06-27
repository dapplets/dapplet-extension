import { Registry } from './registry';
import { DevRegistry } from './devRegistry';
import { EthRegistry } from './ethRegistry';
import GlobalConfigService from '../services/globalConfigService';
import { compare } from 'semver';
import { mergeDedupe, typeOfUri, UriTypes, assertFullfilled, assertRejected } from '../../common/helpers';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';

export class RegistryAggregator {
    public isAvailable: boolean = true;
    public registries: Registry[] = [];
    private _globalConfigService = new GlobalConfigService();

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();

        const versionsWithErrors = await Promise.allSettled(this.registries.map(r => r.getVersionNumbers(name, branch)));
        versionsWithErrors.filter(assertRejected).forEach(p => console.error(p.reason));
        const versionsNoErrors = versionsWithErrors.filter(assertFullfilled).map(p => p.value);
        const versionsNotSorted = mergeDedupe(versionsNoErrors);
        const versionsAsc = versionsNotSorted.sort(compare); // ASC sorting by semver

        return versionsAsc;
    }

    async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        await this._initRegistries();

        const uriWithErrors = await Promise.allSettled(this.registries.map(r => r.getVersionInfo(name, branch, version)));
        uriWithErrors.filter(assertRejected).forEach(p => console.error(p.reason));
        const uriNoErrors = uriWithErrors.filter(assertFullfilled).map(p => p.value);

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
        const regFeatures = await Promise.allSettled(this.registries.map(r => r.getModuleInfo(locations, users).then(m => ([r.url, m]))));
        regFeatures.filter(assertRejected).forEach(p => console.error(p.reason));
        const validRegFeatures = regFeatures.filter(assertFullfilled).map((p) => p.value);
        const merged = Object.fromEntries(validRegFeatures);

        // Below is some magic, which finds modules by names and interfaces in another registries.
        // For example: 
        // 1) An interface, linked with some location, is in the registry A.
        // 2) An adapter, implementing the interface, is in the registry A.
        // 3) An feature, using this adapter, is in the registry B.
        // 4) Without this magic, the feature will not be found by the location, with which the interface is linked.

        const additionalLocations = validRegFeatures.map(([k, v]) => ([k, Object.entries(v).map(([k2, v2]) => ([k2, mergeDedupe(v2.map(x => ([x.name, ...x.interfaces])))])).filter(x => x[1].length !== 0)])) as [string, [string, string[]][]][];
        const promiseResults = await Promise.allSettled(additionalLocations.map(([registryUrl, locations2]) => Promise.allSettled(locations2.map(([oldLocation, newLocations]) => Promise.allSettled(this.registries.filter(r => r.url !== registryUrl).map(r => r.getModuleInfo(newLocations, users).then(res => ([r.url, oldLocation, mergeDedupe(Object.entries(res).map(x => x[1]))]))))))));
        const promiseValues = mergeDedupe(promiseResults.filter(assertFullfilled).map(x => mergeDedupe(x.value.filter(assertFullfilled).map(y => y.value.filter(assertFullfilled).map(z => z.value))))) as [string, string, ModuleInfo[]][];
        promiseValues.forEach(([regUrl, location, modules]) => {
            if (!merged[regUrl]) merged[regUrl] = {};
            if (!merged[regUrl][location]) merged[regUrl][location] = [];
            merged[regUrl][location].push(...modules);
        });

        return merged;
    }

    public async getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]> {
        await this._initRegistries();
        const modules = await Promise.allSettled(this.registries.map(r => r.getAllDevModules()));
        modules.filter(assertRejected).forEach(p => console.error(p.reason));
        const validModules = modules.filter(assertFullfilled).map(p => p.value);
        if (!validModules || validModules.length === 0) return [];
        const reduced = validModules.reduce((a, b) => a.concat(b));
        return reduced;
    }

    private async _initRegistries() {
        // ToDo: fetch LocalConfig
        const registries = await this._globalConfigService.getRegistries();
        const isDevMode = await this._globalConfigService.getDevMode();

        // ToDo: optimize comparison
        if (registries.filter(x => isDevMode || (!isDevMode && x.isDev === false)).length !== this.registries.length) {
            // ToDo: Dev registries are priority
            this.registries = registries.filter(x => isDevMode || (!isDevMode && x.isDev === false)).sort((a, b) => (a.isDev === false) ? 1 : -1)
                .map(r => {
                    const uriType = typeOfUri(r.url);

                    if (uriType === UriTypes.Http && r.isDev) return new DevRegistry(r.url);
                    if (uriType === UriTypes.Ethereum || uriType === UriTypes.Ens) return new EthRegistry(r.url);
                });
        }
    }

    public getRegistryByUri(uri: string): Registry {
        return this.registries.find(f => f.url === uri);
    }
}