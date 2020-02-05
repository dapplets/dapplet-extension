import ManifestDTO from '../dto/manifestDTO';
import SiteConfigBrowserStorage from '../browserStorages/siteConfigBrowserStorage';
import ModuleManager from '../utils/moduleManager';
import * as extension from 'extensionizer';
import Manifest from '../models/manifest';
import { StorageAggregator } from '../moduleStorages/moduleStorage';

export default class FeatureService {
    private _siteConfigRepository = new SiteConfigBrowserStorage();
    private _moduleManager = new ModuleManager();
    private _storageAggregator = new StorageAggregator();

    async getFeaturesByHostnames(hostnames: string[]): Promise<ManifestDTO[]> {
        const hostnamesManfiests = await this._moduleManager.getFeaturesByHostnames(hostnames);
        const dtos: ManifestDTO[] = [];

        for (const [hostname, manifests] of Object.entries(hostnamesManfiests)) {
            let i = 0;
            for (const manifest of manifests) {
                const dto = dtos.find(f => f.name === manifest.name && f.branch === manifest.branch && f.version === manifest.version);
                if (!dto) {
                    const dto: ManifestDTO = manifest as any;
                    const config = await this._siteConfigRepository.getById(hostname); // ToDo: which contextId should we compare?
                    dto.isActive = config.activeFeatures[dto.name]?.isActive || false;
                    dto.order = i++;
                    if (!dto.hostnames) dto.hostnames = [];
                    dto.hostnames.push(hostname);
                    dtos.push(dto);
                } else {
                    if (!dto.hostnames) dto.hostnames = [];
                    dto.hostnames.push(hostname);
                }
            }
        }

        return dtos;
    }

    private async _setFeatureActive(name: string, version: string, hostnames: string[], isActive: boolean) {
        const hostnamesManfiests = await this._moduleManager.getFeaturesByHostnames(hostnames);

        for (const hostname in hostnamesManfiests) {
            const config = await this._siteConfigRepository.getById(hostname);
            config.activeFeatures[name] = {
                version,
                isActive
                // ToDo: get a order from the config
            };

            await this._siteConfigRepository.update(config);

            const order = hostnamesManfiests[hostname].findIndex(f => f.name === name); // ToDo: fix order
            extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
                var activeTab = tabs[0];
                extension.tabs.sendMessage(activeTab.id, {
                    type: isActive ? "FEATURE_ACTIVATED" : "FEATURE_DEACTIVATED",
                    payload: {
                        name,
                        version,
                        branch: "default", // ToDo: fix branch
                        order,
                        contextIds: hostnames
                    }
                });
            });
        }
    }

    async activateFeature(name: string, version: string, hostnames: string[]): Promise<void> {
        return await this._setFeatureActive(name, version, hostnames, true);
    }

    async deactivateFeature(name: string, version: string, hostnames: string[]): Promise<void> {
        return await this._setFeatureActive(name, version, hostnames, false);
    }

    public async getActiveModulesByHostnames(hostnames: string[]): Promise<{ name: string, branch: string, version: string, order: number, hostnames: string[] }[]> {
        const featureNames = await this.getFeaturesByHostnames(hostnames);
        const activeModules = featureNames.filter(f => f.isActive === true)
            .map(m => ({
                name: m.name,
                branch: m.branch,
                version: m.version,
                order: m.order,
                hostnames: m.hostnames
            }));
        return activeModules;
    }

    public async getModulesWithDeps(modules: { name: string, branch: string, version: string }[]) {
        if (modules.length === 0) return [];
        const modulesWithDeps = await this._moduleManager.resolveDependencies(modules);
        const promises = modulesWithDeps.map(m => this._moduleManager.loadModule(m.name, m.branch, m.version));
        const loadedModules = await Promise.all(promises);
        return loadedModules;
    }

    public async optimizeDependency(name: string, branch: string, version: string) {
        // ToDo: fix this hack
        return await this._moduleManager.optimizeDependency(name, version, branch);
    };

    public async getAllDevModules() {
        return await this._moduleManager.getAllDevModules();
    }

    // ToDo: move to another service?
    public async deployModule(defaultManifest: Manifest, targetStorage: 'swarm' | 'test-registry', targetRegistry: string, registryKey: string): Promise<{ scriptUrl: string, manifestUrl: string }> {

        // Dist file publishing
        const dist = await this._storageAggregator.getResource(defaultManifest.dist);
        const distBlob = new Blob([dist], { type: "text/javascript" });
        const distUrl = (targetStorage === 'test-registry') ? await saveToTestRegistry(distBlob, targetRegistry) : await saveToSwarm(distBlob);

        // Manifest editing
        defaultManifest.dist = distUrl;

        // Manifest publishing
        const manifestString = JSON.stringify(defaultManifest);
        const manifestBlob = new Blob([manifestString], { type: "application/json" });
        const manifestUrl = (targetStorage === 'test-registry') ? await saveToTestRegistry(manifestBlob, targetRegistry) : await saveToSwarm(manifestBlob);

        // Register manifest in Registry
        await addModuleToRegistry(manifestUrl, targetRegistry, registryKey);

        return {
            manifestUrl: manifestUrl,
            scriptUrl: distUrl
        };
    }
}

async function saveToTestRegistry(blob: Blob, registryUrl: string) {
    var form = new FormData();
    form.append('file', blob);

    const response = await fetch(`${registryUrl}/storage`, {
        method: 'POST',
        body: form
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message || "Error in saveToStorage");
    const url = `${registryUrl}/storage/${json.data}`;
    return url;
}

async function saveToSwarm(blob: Blob) {
    const response = await fetch("https://swarm-gateways.net/bzz:/", {
        method: 'POST',
        body: blob
    });

    const text = await response.text();
    if (text.length !== 64) throw new Error("Swarm gateway returned invalid hash.");
    const url = "bzz://" + text;
    return url;
}

async function addModuleToRegistry(manifestUrl: string, targetRegistry: string, registryKey: string) {
    const response = await fetch(`${targetRegistry}/registry/add-module?uri=${encodeURIComponent(manifestUrl)}&key=${registryKey}`, {
        method: 'POST'
    });

    const json = await response.json();
    if (!json.success) throw new Error(json.message || "Error in addModuleToRegistry");
    return;
}