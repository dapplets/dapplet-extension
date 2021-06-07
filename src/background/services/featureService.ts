import ManifestDTO from '../dto/manifestDTO';
import ModuleManager from '../utils/moduleManager';
import { browser } from "webextension-polyfill-ts";
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import GlobalConfigService from './globalConfigService';
import { DEFAULT_BRANCH_NAME, StorageTypes } from '../../common/constants';
import { rcompare } from 'semver';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import JSZip from 'jszip';
import * as logger from '../../common/logger';
import { getCurrentTab, mergeDedupe, parseModuleName } from '../../common/helpers';
import { WalletService } from './walletService';
import { Tar } from '../../common/tar';

export default class FeatureService {
    private _moduleManager: ModuleManager;
    private _storageAggregator = new StorageAggregator();

    constructor(
        private _globalConfigService: GlobalConfigService,
        private _walletService: WalletService
    ) {
        this._moduleManager = new ModuleManager(this._globalConfigService, this._walletService);
    }

    async getFeaturesByHostnames(contextIds: string[]): Promise<ManifestDTO[]> {
        const users = await this._globalConfigService.getTrustedUsers();
        this._moduleManager = new ModuleManager(this._globalConfigService, this._walletService);
        const contextIdsByRegsitries = await this._moduleManager.registryAggregator.getModuleInfoWithRegistries(contextIds, users.map(u => u.account));
        const dtos: ManifestDTO[] = [];

        const configRegistries = await this._globalConfigService.getRegistries();

        let i = 0;

        // ToDo: how to merge modules from different registries???
        for (const [registryUrl, moduleInfosByContextId] of Object.entries(contextIdsByRegsitries)) {
            for (const [contextId, moduleInfos] of Object.entries(moduleInfosByContextId)) {
                for (const moduleInfo of moduleInfos) {
                    const dto = dtos.find(d => d.name === moduleInfo.name);
                    if (!dto) {
                        const dto: ManifestDTO = moduleInfo as any;
                        const config = await this._globalConfigService.getSiteConfigById(contextId); // ToDo: which contextId should we compare?
                        dto.isActive = config.activeFeatures[dto.name]?.isActive || false;
                        dto.isActionHandler = config.activeFeatures[dto.name]?.runtime?.isActionHandler || false;
                        dto.isHomeHandler = config.activeFeatures[dto.name]?.runtime?.isHomeHandler || false;
                        dto.activeVersion = (dto.isActive) ? (config.activeFeatures[dto.name]?.version || null) : null;
                        dto.lastVersion = (dto.isActive) ? await this.getVersions(registryUrl, dto.name).then(x => x.sort(rcompare)[0]) : null; // ToDo: how does this affect performance?
                        dto.order = i++;
                        dto.sourceRegistry = {
                            url: registryUrl,
                            isDev: configRegistries.find(r => r.url === registryUrl).isDev
                        };
                        if (!dto.hostnames) dto.hostnames = [];
                        dto.hostnames.push(contextId);
                        dto.available = true;
                        dtos.push(dto);
                    } else {
                        // ToDo: move this merging logic to aggragator
                        if (!dto.hostnames) dto.hostnames = [];
                        dto.hostnames = mergeDedupe([dto.hostnames, [contextId]]);
                    }
                }
            }
        }

        // Adding of unavailable dapplets
        for (const contextId of contextIds) {
            const config = await this._globalConfigService.getSiteConfigById(contextId);
            for (const moduleName in config.activeFeatures) {
                const moduleInfo = config.activeFeatures[moduleName].moduleInfo;
                if (dtos.find(x => x.name === moduleName) || !moduleInfo) continue;
                const registryUrl = config.activeFeatures[moduleName].registryUrl;
                const dto: ManifestDTO = moduleInfo as any;
                dto.isActive = config.activeFeatures[dto.name]?.isActive || false;
                dto.isActionHandler = config.activeFeatures[dto.name]?.runtime?.isActionHandler || false;
                dto.isHomeHandler = config.activeFeatures[dto.name]?.runtime?.isHomeHandler || false;
                dto.activeVersion = (dto.isActive) ? (config.activeFeatures[dto.name]?.version || null) : null;
                dto.lastVersion = (dto.isActive) ? await this.getVersions(registryUrl, dto.name).then(x => x.sort(rcompare)[0]).catch(x => null) : null; // ToDo: how does this affect performance?
                dto.order = i++;
                dto.sourceRegistry = {
                    url: registryUrl,
                    isDev: configRegistries.find(r => r.url === registryUrl)?.isDev
                };
                if (!dto.hostnames) dto.hostnames = [];
                dto.hostnames.push(contextId);
                dto.available = false;
                dtos.push(dto);
            }
        }

        return dtos;
    }

    private async _setFeatureActive(name: string, version: string | undefined, hostnames: string[], isActive: boolean, order: number, registryUrl: string) {
        hostnames = Array.from(new Set(hostnames)); // deduplicate

        if (!version && isActive) {
            const versions = await this.getVersions(registryUrl, name);
            version = versions.sort(rcompare)[0]; // Last version by SemVer
        }

        // Cache manifest
        let moduleInfo = null;
        const _getModuleInfo = async () => {
            if (!moduleInfo) moduleInfo = await this.getModuleInfoByName(registryUrl, name);
            return moduleInfo;
        }

        // ToDo: save registry url of activate module?
        for (const hostname of hostnames) {
            const config = await this._globalConfigService.getSiteConfigById(hostname);
            if (!isActive) version = config.activeFeatures[name].version;
            config.activeFeatures[name] = {
                version,
                isActive,
                order,
                runtime: null,
                moduleInfo: isActive ? await _getModuleInfo() : (config.activeFeatures[name].moduleInfo ?? await _getModuleInfo()),
                registryUrl
            };

            await this._globalConfigService.updateSiteConfig(config);
        }

        try {
            const runtime = await new Promise<void>(async (resolve, reject) => {
                // listening of loading/unloading from inpage
                const listener = (message, sender) => {
                    if (!message || !message.type || !message.payload) return;
                    const p = message.payload;
                    if (message.type === 'FEATURE_LOADED') {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === version && isActive === true) {
                            browser.runtime.onMessage.removeListener(listener);
                            resolve(p.runtime);
                        }
                    } else if (message.type === "FEATURE_UNLOADED") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === version && isActive === false) {
                            browser.runtime.onMessage.removeListener(listener);
                            resolve(p.runtime);
                        }
                    } else if (message.type === "FEATURE_LOADING_ERROR") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === version && isActive === true) {
                            browser.runtime.onMessage.removeListener(listener);
                            reject(p.error);
                        }
                    } else if (message.type === "FEATURE_UNLOADING_ERROR") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === version && isActive === false) {
                            browser.runtime.onMessage.removeListener(listener);
                            reject(p.error);
                        }
                    }
                }

                browser.runtime.onMessage.addListener(listener);

                // sending command to inpage
                const activeTab = await getCurrentTab();
                browser.tabs.sendMessage(activeTab.id, {
                    type: isActive ? "FEATURE_ACTIVATED" : "FEATURE_DEACTIVATED",
                    payload: [{
                        name,
                        version,
                        branch: DEFAULT_BRANCH_NAME, // ToDo: fix branch
                        order,
                        contextIds: hostnames
                    }]
                });
            });

            // ToDo: merge with config updating upper
            for (const hostname of hostnames) {
                const config = await this._globalConfigService.getSiteConfigById(hostname);
                config.activeFeatures[name].runtime = runtime;
                await this._globalConfigService.updateSiteConfig(config);
            }
        } catch (err) {
            // revert config if error
            for (const hostname of hostnames) {
                const config = await this._globalConfigService.getSiteConfigById(hostname);
                config.activeFeatures[name] = {
                    version,
                    isActive: !isActive,
                    order,
                    runtime: null,
                    moduleInfo: config.activeFeatures[name].moduleInfo,
                    registryUrl
                };

                await this._globalConfigService.updateSiteConfig(config);
            }

            // ToDo: error doesn't come to popup without this rethrowing
            throw new Error(err);
        }
    }

    async activateFeature(name: string, version: string | undefined, hostnames: string[], order: number, registryUrl: string): Promise<void> {
        await this._setFeatureActive(name, version, hostnames, true, order, registryUrl);
    }

    async deactivateFeature(name: string, version: string | undefined, hostnames: string[], order: number, registryUrl: string): Promise<void> {
        await this._setFeatureActive(name, version, hostnames, false, order, registryUrl);
    }

    async reloadFeature(name: string, version: string | undefined, hostnames: string[], order: number, registryUrl: string): Promise<void> {
        const modules = await this.getActiveModulesByHostnames(hostnames);
        if (!modules.find(m => m.name === name)) return;
        await this._setFeatureActive(name, version, hostnames, false, order, registryUrl);
        await this._setFeatureActive(name, version, hostnames, true, order, registryUrl);
    }

    public async getActiveModulesByHostnames(contextIds: string[]) {
        const globalConfig = await this._globalConfigService.get();
        if (globalConfig.suspended) return [];

        const configs = await Promise.all(contextIds.map(h => this._globalConfigService.getSiteConfigById(h)));
        const modules: { name: string, branch: string, version: string, order: number, hostnames: string[] }[] = [];

        let i = 0;
        for (const config of configs) {
            if (config.paused) continue;
            for (const name in config.activeFeatures) {
                if (config.activeFeatures[name].isActive !== true) continue;

                const branch = 'default';
                const version = config.activeFeatures[name].version;
                const index = modules.findIndex(m => m.name === name && m.branch === branch && m.version === version);

                if (index !== -1) {
                    modules[index].hostnames.push(config.hostname);
                } else {
                    modules.push({
                        name,
                        branch, // ToDo: is it correct?
                        version,
                        order: i++,
                        hostnames: [config.hostname]
                    });
                }
            }
        }

        // Activate dynamic adapter for dynamic contexts searching
        const hostnames = contextIds.filter(x => /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/gm.test(x));
        if (hostnames.length > 0) {
            const dynamicAdapter = await this._globalConfigService.getDynamicAdapter();
            if (dynamicAdapter) {
                const parsed = parseModuleName(dynamicAdapter);
                if (parsed) {
                    modules.push({
                        name: parsed.name,
                        branch: parsed.branch,
                        version: parsed.version,
                        order: -1,
                        hostnames: hostnames
                    });
                }
            }
        }        

        return modules;
    }

    public async getModulesWithDeps(modules: { name: string, branch?: string, version?: string, contextIds: string[] }[]) {
        const moduleManager = new ModuleManager(this._globalConfigService, this._walletService);

        if (modules.length === 0) return [];
        const modulesWithDeps = await moduleManager.resolveDependencies(modules);
        // ToDo: catch errors
        // ToDo: run parallel
        const dists = await Promise.all(modulesWithDeps.map(m => moduleManager.loadModule(m.manifest)));

        return modulesWithDeps.map((m, i) => ({
            manifest: Object.assign(m.manifest, dists[i].internalManifest), // merge manifests from registry and bundle (zip) 
            script: dists[i].script,
            defaultConfig: dists[i].defaultConfig
        }));
    }

    public async optimizeDependency(name: string, branch: string, version: string, contextIds: string[]) {
        // ToDo: fix this hack
        return this._moduleManager.optimizeDependency(name, version, branch, contextIds);
    };

    public async getAllDevModules() {
        return this._moduleManager.registryAggregator.getAllDevModules();
    }

    // ToDo: move to another service?
    public async deployModule(mi: ModuleInfo, vi: VersionInfo, targetStorage: StorageTypes, targetRegistry: string): Promise<{ scriptUrl: string }> {
        try {
            // ToDo: check everything before publishing
            if (mi.icon && !mi.icon.uris[0].endsWith('.png')) throw new Error('Type of module icon must be PNG.');

            let scriptUrl = null;

            const zip = new JSZip();

            if (vi.main) {
                const arr = await this._storageAggregator.getResource(vi.main);
                zip.file('index.js', arr);
            }

            if (vi.defaultConfig) {
                const arr = await this._storageAggregator.getResource(vi.defaultConfig);
                zip.file('default.json', arr);
            }

            if (vi.schemaConfig) {
                const arr = await this._storageAggregator.getResource(vi.schemaConfig);
                zip.file('schema.json', arr);
            }

            // upload overlays declared in manifest
            // it packs all files from `assets-manifest.json` into tar container
            if (vi.overlays) {
                for (const overlayName in vi.overlays) {
                    const baseUrl = vi.overlays[overlayName].uris[0];
                    const assetManifestUrl = new URL('assets-manifest.json', baseUrl).href;
                    const arr = await this._storageAggregator.getResource({ uris: [assetManifestUrl], hash: null });
                    const json = String.fromCharCode.apply(null, new Uint8Array(arr));
                    const assetManifest = JSON.parse(json);
                    const assets = Object.values(assetManifest);

                    const files = await Promise.all(assets.map((x: string) => this._storageAggregator.getResource({ uris: [new URL(x, baseUrl).href], hash: null }).then(y => ({ url: x, arr: y }))));

                    const tar = new Tar();
                    for (const file of files) {
                        const path = (file.url[0] === '/') ? file.url.slice(1) : file.url;
                        tar.addFileArrayBuffer(path, file.arr);
                    }
                    const blob = await tar.write();

                    const hashUris = await this._storageAggregator.saveDir(blob, [targetStorage]);
                    vi.overlays[overlayName] = hashUris;

                    console.log(hashUris);
                }

                // Add manifest to zip (just for overlays yet)
                const manifest = { overlays: vi.overlays };
                const manifestJson = JSON.stringify(manifest);
                const manifestArr = new TextEncoder().encode(manifestJson);
                zip.file('dapplet.json', manifestArr);
            }

            if (vi.main) {
                // Dist file publishing
                const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
                const blob = new Blob([buf], { type: "application/zip" });
                const hashUris = await this._storageAggregator.save(blob, [targetStorage]);

                // Manifest editing
                vi.dist = hashUris;
                scriptUrl = hashUris.uris[0]; // ToDo: remove it?
            }

            if (mi.icon) {
                // Icon file publishing
                const buf = await this._storageAggregator.getResource(mi.icon);
                const blob = new Blob([buf], { type: "image/png" });
                const hashUris = await this._storageAggregator.save(blob, [targetStorage]);

                // Manifest editing
                mi.icon = hashUris;
            }

            // Register manifest in Registry
            const registry = this._moduleManager.registryAggregator.getRegistryByUri(targetRegistry);
            if (!registry) throw new Error("No registry with this url exists in config.");
            await registry.addModule(mi, vi);

            return { scriptUrl };
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

    public async removeDapplet(name: string, hostnames: string[]) {
        let version = null;
        let order = null;
        let wasActive = false;

        for (const hostname of hostnames) {
            const config = await this._globalConfigService.getSiteConfigById(hostname);
            if (!config.activeFeatures[name]) continue;
            version = config.activeFeatures[name].version;
            order = config.activeFeatures[name].order;
            wasActive = wasActive || config.activeFeatures[name].isActive;
            delete config.activeFeatures[name];
            await this._globalConfigService.updateSiteConfig(config);
        }

        if (wasActive) {
            // sending command to inpage
            const activeTab = await getCurrentTab();
            browser.tabs.sendMessage(activeTab.id, {
                type: "FEATURE_DEACTIVATED",
                payload: [{
                    name,
                    version,
                    branch: DEFAULT_BRANCH_NAME, // ToDo: fix branch
                    order,
                    contextIds: hostnames
                }]
            });
        }
    }

    async getRegistries() {
        const configRegistries = await this._globalConfigService.getRegistries();
        const result = configRegistries.map(c => {
            const reg = this._moduleManager.registryAggregator.getRegistryByUri(c.url);
            return {
                isAvailable: reg?.isAvailable || false,
                error: reg?.error,
                ...c
            }
        });

        return result;
    }

    public async getOwnership(registryUri: string, moduleName: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        const owner = await registry.getOwnership(moduleName);
        return owner;
    }

    public async getVersionInfo(registryUri: string, moduleName: string, branch: string, version: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        return registry.getVersionInfo(moduleName, branch, version);
    }

    public async getModuleInfoByName(registryUri: string, moduleName: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        return registry.getModuleInfoByName(moduleName);
    }

    public async transferOwnership(registryUri: string, moduleName: string, address: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        await registry.transferOwnership(moduleName, address);
    }

    public async addLocation(registryUri: string, moduleName: string, location: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        await registry.addContextId(moduleName, location);
    }

    public async removeLocation(registryUri: string, moduleName: string, location: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        await registry.removeContextId(moduleName, location);
    }

    public async getVersions(registryUri: string, moduleName: string) {
        const registry = this._moduleManager.registryAggregator.getRegistryByUri(registryUri);
        if (!registry) throw new Error("No registry with this url exists in config.");
        const versions = await registry.getVersionNumbers(moduleName, DEFAULT_BRANCH_NAME);
        if (versions.length === 0) throw new Error("This module has no versions.");
        return versions;
    }

    public async openSettingsOverlay(mi: ManifestDTO) {
        const versions = await this.getVersions(mi.sourceRegistry.url, mi.name);
        const version = versions.sort(rcompare)[0]; // Last version by SemVer
        const vi = await this._moduleManager.registryAggregator.getVersionInfo(mi.name, DEFAULT_BRANCH_NAME, version);
        const dist = await this._moduleManager.loadModule(vi);
        const activeTab = await getCurrentTab();
        browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_SETTINGS_OVERLAY",
            payload: { mi, vi, schemaConfig: dist.schemaConfig, defaultConfig: dist.defaultConfig }
        });
    }

    public async openDappletAction(moduleName: string, tabId: number) {
        return browser.tabs.sendMessage(tabId, {
            type: "OPEN_DAPPLET_ACTION",
            payload: { moduleName }
        });
    }

    public async openDappletHome(moduleName: string, tabId: number) {
        return browser.tabs.sendMessage(tabId, {
            type: "OPEN_DAPPLET_HOME",
            payload: { moduleName }
        });
    }
}