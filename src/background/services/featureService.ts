import ManifestDTO from '../dto/manifestDTO';
import SiteConfigBrowserStorage from '../browserStorages/siteConfigBrowserStorage';
import ModuleManager from '../utils/moduleManager';
import { browser } from "webextension-polyfill-ts";
import { StorageAggregator } from '../moduleStorages/moduleStorage';
import GlobalConfigService from './globalConfigService';
import * as ethers from 'ethers';
import { DEFAULT_BRANCH_NAME, StorageTypes } from '../../common/constants';
import { rcompare } from 'semver';
import ModuleInfo from '../models/moduleInfo';
import VersionInfo from '../models/versionInfo';
import { SwarmModuleStorage } from '../moduleStorages/swarmModuleStorage';
import { HttpModuleStorage } from '../moduleStorages/httpModuleStorage';
import { SchemaConfig, DefaultConfig } from '../../common/types';
import * as JSZip from 'jszip';
import * as logger from '../../common/logger';
import { getCurrentTab, mergeDedupe } from '../../common/helpers';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigBrowserStorage();
    private _globalConfigService = new GlobalConfigService();
    private _moduleManager = new ModuleManager();
    private _storageAggregator = new StorageAggregator();

    async getFeaturesByHostnames(contextIds: string[]): Promise<ManifestDTO[]> {
        const users = await this._globalConfigService.getTrustedUsers();
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
                        const config = await this._siteConfigRepository.getById(contextId); // ToDo: which contextId should we compare?
                        dto.isActive = config.activeFeatures[dto.name]?.isActive || false;
                        dto.activeVersion = (dto.isActive) ? (config.activeFeatures[dto.name]?.version || null) : null;
                        dto.lastVersion = (dto.isActive) ? await this.getVersions(registryUrl, dto.name).then(x => x.sort(rcompare)[0]) : null; // ToDo: how does this affect performance?
                        dto.order = i++;
                        dto.sourceRegistry = {
                            url: registryUrl,
                            isDev: configRegistries.find(r => r.url === registryUrl).isDev
                        };
                        if (!dto.hostnames) dto.hostnames = [];
                        dto.hostnames.push(contextId);
                        dtos.push(dto);
                    } else {
                        // ToDo: move this merging logic to aggragator
                        if (!dto.hostnames) dto.hostnames = [];
                        dto.hostnames = mergeDedupe([dto.hostnames, [contextId]]);
                    }
                }
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

        // ToDo: save registry url of activate module?
        for (const hostname of hostnames) {
            const config = await this._siteConfigRepository.getById(hostname);
            if (!isActive) version = config.activeFeatures[name].version;
            config.activeFeatures[name] = {
                version,
                isActive,
                order
            };

            await this._siteConfigRepository.update(config);
        }

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

        try {
            await new Promise<void>((resolve, reject) => {
                // listening of loading/unloading from inpage
                const listener = (message, sender) => {
                    if (!message || !message.type || !message.payload) return;
                    const p = message.payload;
                    if (message.type === 'FEATURE_LOADED') {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === p.version && isActive === true) {
                            browser.runtime.onMessage.removeListener(listener);
                            resolve();
                        }
                    } else if (message.type === "FEATURE_UNLOADED") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === p.version && isActive === false) {
                            browser.runtime.onMessage.removeListener(listener);
                            resolve();
                        }
                    } else if (message.type === "FEATURE_LOADING_ERROR") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === p.version && isActive === true) {
                            browser.runtime.onMessage.removeListener(listener);
                            reject(p.error);
                        }
                    } else if (message.type === "FEATURE_UNLOADING_ERROR") {
                        if (p.name === name && p.branch === DEFAULT_BRANCH_NAME && p.version === p.version && isActive === false) {
                            browser.runtime.onMessage.removeListener(listener);
                            reject(p.error);
                        }
                    }
                }

                browser.runtime.onMessage.addListener(listener);
            });
        } catch (err) {
            // revert config if error
            for (const hostname of hostnames) {
                const config = await this._siteConfigRepository.getById(hostname);
                config.activeFeatures[name] = {
                    version,
                    isActive: !isActive,
                    order
                };

                await this._siteConfigRepository.update(config);
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

    public async getActiveModulesByHostnames(hostnames: string[]) {
        const globalConfig = await this._globalConfigService.get();
        if (globalConfig.suspended) return [];

        const configs = await Promise.all(hostnames.map(h => this._siteConfigRepository.getById(h)));
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

        return modules;
    }

    public async getModulesWithDeps(modules: { name: string, branch: string, version: string, contextIds: string[] }[]) {
        if (modules.length === 0) return [];
        const modulesWithDeps = await this._moduleManager.resolveDependencies(modules);
        // ToDo: catch errors
        // ToDo: run parallel
        const dists = await Promise.all(modulesWithDeps.map(m => this._moduleManager.loadModule(m.manifest)));

        return modulesWithDeps.map((m, i) => ({
            manifest: m.manifest,
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
            // ToDo: check everething before publishing
            const swarmStorage = new SwarmModuleStorage();
            const testStorage = new HttpModuleStorage();

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

            if (vi.main) {
                // Dist file publishing
                const dist = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
                const distBlob = new Blob([dist], { type: "text/javascript" });
                const distUrl = (targetStorage === StorageTypes.TestRegsitry) ? await testStorage.save(distBlob, targetRegistry) : await swarmStorage.save(distBlob);

                // Dist file  hashing
                const distBuffer = await (distBlob as any).arrayBuffer();
                const distHash = ethers.utils.keccak256(new Uint8Array(distBuffer));

                // Manifest editing
                vi.dist = {
                    hash: distHash,
                    uris: [distUrl]
                };

                scriptUrl = distUrl;
            }

            if (mi.icon) {
                // Icon file publishing
                const icon = await this._storageAggregator.getResource(mi.icon);
                const iconBlob = new Blob([icon], { type: "text/javascript" });
                const iconUrl = (targetStorage === StorageTypes.TestRegsitry) ? await testStorage.save(iconBlob, targetRegistry) : await swarmStorage.save(iconBlob);

                // Icon file  hashing
                const iconBuffer = await (iconBlob as any).arrayBuffer();
                const iconHash = ethers.utils.keccak256(new Uint8Array(iconBuffer));

                // Manifest editing
                mi.icon = {
                    hash: iconHash,
                    uris: [iconUrl]
                };
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
}