import { Registry } from './registry';
import { DevRegistry } from './devRegistry';
import { EthRegistry } from './ethRegistry';
import GlobalConfigService from '../services/globalConfigService';
import { compare, rcompare } from 'semver';
import { mergeDedupe, typeOfUri, UriTypes, assertFullfilled, assertRejected } from '../../common/helpers';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { Environments, DefaultSigners } from '../../common/types';
import { allSettled } from '../../common/helpers';

import { WalletService } from '../services/walletService';
import { NearRegistry } from './nearRegistry';
import { ModuleTypes } from '../../common/constants';
import VersionInfoBrowserStorage from '../browserStorages/versionInfoStorage';
import ModuleInfoBrowserStorage from '../browserStorages/moduleInfoStorage';

if (!Promise.allSettled) Promise.allSettled = allSettled;

export class RegistryAggregator {
    public isAvailable: boolean = true;
    public registries: Registry[] = [];

    private _versionInfoStorage = new VersionInfoBrowserStorage();

    constructor(
        private _globalConfigService: GlobalConfigService,
        private _walletService: WalletService
    ) { }

    async getVersions(name: string, branch: string): Promise<string[]> {
        await this._initRegistries();
        const registries = this._getNonSkippedRegistries();

        const versionsWithErrors = await Promise.allSettled(registries.map(r => r.getVersionNumbers(name, branch)));
        versionsWithErrors.filter(assertRejected).forEach(p => console.error(p.reason));
        const versionsNoErrors = versionsWithErrors.filter(assertFullfilled).map(p => p.value);
        const versionsNotSorted = mergeDedupe(versionsNoErrors);
        const versionsAsc = versionsNotSorted.sort(compare); // ASC sorting by semver

        return versionsAsc;
    }

    async getLastVersion(name: string, branch: string): Promise<string | null> {
        const versions = await this.getVersions(name, branch);
        if (versions.length === 0) return null;
        return versions.sort(rcompare)[0];
    }

    async getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo> {
        await this._initRegistries();
        const registries = this._getNonSkippedRegistries();

        const registriesConfig = await this._globalConfigService.getRegistries();

        const uriWithErrors = await Promise.allSettled(registries.map(r => {
            const isDev = registriesConfig.find(c => c.url === r.url).isDev;
            const promise = isDev ? r.getVersionInfo(name, branch, version) : this._cacheVersionInfo(r, name, branch, version);
            return promise.then(vi => {
                if (!vi) return null;
                vi.environment = isDev ? Environments.Dev : Environments.Test;
                return vi;
            })
        }));

        const uriNoErrors = uriWithErrors.filter(assertFullfilled).map(p => p.value).filter(v => v !== null);
        const uriErrors = uriWithErrors.filter(assertRejected);

        if (uriNoErrors.length === 0) {
            uriErrors.forEach(p => console.error(p.reason));
            console.error(`Could not find the manifest URI of the ${name}#${branch}@${version} module`);
            return null;
        }

        const vi = uriNoErrors[0];

        if (!vi) {
            return null;
        }

        if (vi.name !== name || vi.version !== version || vi.branch !== branch) {
            console.error(`Invalid public name for module. Requested: ${name}#${branch}@${version}. Recieved: ${vi.name}#${vi.branch}@${vi.version}.`);
            return null;
        }

        return vi;
    }

    public async getModuleInfoWithRegistries(locations: string[], users: string[]): Promise<{ [registryUrl: string]: { [hostname: string]: ModuleInfo[] } }> {
        await this._initRegistries();
        const registries = this._getNonSkippedRegistries();

        const regFeatures = await Promise.allSettled(registries.map(r => r.getModuleInfo(locations, users).then(m => ([r.url, m]))));
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
        const mergedModuleInfos = Object.values(merged).map(x => Object.values(x).reduce((a, b) => a.concat(b), [])).reduce((a, b) => a.concat(b), []);
        for (const [registryUrl, contexts] of additionalLocations) {
            for (const context of contexts) {
                context[1] = context[1].filter(c => mergedModuleInfos.find(x => x.name === c)?.type !== ModuleTypes.Feature);
            }
        }
        const promiseResults = await Promise.allSettled(additionalLocations.map(([registryUrl, locations2]) => Promise.allSettled(locations2.map(([oldLocation, newLocations]) => Promise.allSettled(registries.filter(r => r.url !== registryUrl).map(r => r.getModuleInfo(newLocations, users).then(res => ([r.url, oldLocation, mergeDedupe(Object.entries(res).map(x => x[1]))]))))))));
        const promiseValues = mergeDedupe(promiseResults.filter(assertFullfilled).map(x => mergeDedupe(x.value.filter(assertFullfilled).map(y => y.value.filter(assertFullfilled).map(z => z.value))))) as [string, string, ModuleInfo[]][];
        promiseValues.forEach(([regUrl, location, modules]) => {
            if (!merged[regUrl]) merged[regUrl] = {};
            if (!merged[regUrl][location]) merged[regUrl][location] = [];
            merged[regUrl][location].push(...modules);
        });

        return merged;
    }

    public async getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[], isDeployed?: boolean[] }[]> {
        await this._initRegistries();
        const registries = this._getNonSkippedRegistries();

        // fetch all dev modules
        const modules = await Promise.allSettled(registries.map(r => r.getAllDevModules()));
        modules.filter(assertRejected).forEach(p => console.error(p.reason));
        const validModules = modules.filter(assertFullfilled).map(p => p.value);
        const reduced = validModules.length > 0 ? validModules.reduce((a, b) => a.concat(b)) : [];

        // check deployment in prod registries
        const registriesConfig = await this._globalConfigService.getRegistries();
        const prodRegistries = registries.filter(r => !registriesConfig.find(rc => rc.url === r.url).isDev);

        if (prodRegistries.length === 0) {
            const result = reduced.map((x, i) => ({ ...x, isDeployed: [] }));
            return result;
        } else {
            const vis = await Promise.all(reduced.map(m => prodRegistries[0].getVersionInfo(m.module.name, m.versions[0].branch, m.versions[0].version).catch(() => null)));
            const result = reduced.map((x, i) => ({ ...x, isDeployed: [!!vis[i]] }));
            return result;
        }
    }

    public async getRegistryByUri(uri: string): Promise<Registry> {
        await this._initRegistries();
        return this.registries.find(f => f.url === uri);
    }

    private async _initRegistries() {
        // ToDo: fetch LocalConfig
        const configuredRegistries = await this._globalConfigService.getRegistries();
        const isDevMode = await this._globalConfigService.getDevMode();
        const eth_signer = await this._walletService.eth_getSignerFor(DefaultSigners.EXTENSION);
        const near_account = await this._walletService.near_getAccount(DefaultSigners.EXTENSION);

        const enabledRegistries = configuredRegistries.filter(x => x.isEnabled);
        const disabledRegistries = configuredRegistries.filter(x => !x.isEnabled);

        // remove disabled registries
        disabledRegistries.forEach(x => this.registries = this.registries.filter(y => y.url !== x.url));

        // ToDo: optimize comparison
        if (enabledRegistries.filter(x => isDevMode || (!isDevMode && x.isDev === false)).length !== this.registries.length) {
            // ToDo: Dev registries are priority
            this.registries = enabledRegistries.filter(x => isDevMode || (!isDevMode && x.isDev === false)).sort((a, b) => (a.isDev === false) ? 1 : -1)
                .map(r => {
                    const uriType = typeOfUri(r.url);

                    if (uriType === UriTypes.Http && r.isDev) return new DevRegistry(r.url);
                    if (uriType === UriTypes.Ethereum || uriType === UriTypes.Ens) return new EthRegistry(r.url, eth_signer);
                    if (uriType === UriTypes.Near) return new NearRegistry(r.url, near_account);

                    console.error("Invalid registry URL");
                    return null;
                }).filter(r => r !== null);
        }
    }

    private _getNonSkippedRegistries() {
        // Skipping of errored registries
        return this.registries.filter(x => x.isAvailable);
    }

    private async _cacheVersionInfo(registry: Registry, name: string, branch: string, version: string) {
        const cachedVi = await this._versionInfoStorage.get(registry.url, name, branch, version);
        if (cachedVi) return cachedVi;

        const vi = await registry.getVersionInfo(name, branch, version);
        if (!vi) return null;

        await this._versionInfoStorage.create(vi);
        return vi;
    }

    // private async _cacheModuleInfo(registry: Registry, name: string) {
    //     const cachedMi = await this._versionInfoStorage.get(registry.url, name);
    //     if (cachedMi) return cachedMi;

    //     const mi = await registry.getModuleInfo(name);
    //     if (!mi) return null;

    //     await this._versionInfoStorage.create(mi);
    //     return mi;
    // }
}