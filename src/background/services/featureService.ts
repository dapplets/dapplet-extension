import File from '../models/file';
import ManifestDTO from '../dto/manifestDTO';
import DappletRegistry from '../api/dappletRegistry';
import ManifestRepository from '../repositories/manifestRepository';
import SiteConfigRepository from '../repositories/siteConfigRepository';
import SiteConfig from '../models/siteConfig';
import Manifest from '../models/manifest';
import { MapperService } from 'simple-mapper';
import GlobalConfigService from './globalConfigService';
import DependencyResolver from '../utils/dependencyResolver';
import NameResolver from '../utils/nameResolver';
import ResourceLoader from '../utils/resourceLoader';
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export default class FeatureService {

    // #region Properties
    private _dappletRegistry = new DappletRegistry();
    private _manifestRepository = new ManifestRepository();
    private _siteConfigRepository = new SiteConfigRepository();
    private _mapperService = new MapperService();
    private _globalConfigService = new GlobalConfigService();
    private _nameResolver = new NameResolver();
    private _resourceLoader = new ResourceLoader();
    private _dependencyResolver = new DependencyResolver(this._nameResolver, this._resourceLoader);

    // #endregion

    // #region Methods for Popup
    async getFeaturesByHostname(hostname: string): Promise<ManifestDTO[]> {
        let featuresDto: ManifestDTO[] = [];

        const devFeatures = await this.getDevFeaturesByHostname(hostname);
        featuresDto = featuresDto.concat(devFeatures);

        const prodFeatures = await this.getProdScriptsByHostname(hostname);
        featuresDto = featuresDto.concat(prodFeatures);

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

    async getDevFeaturesByHostname(hostname): Promise<ManifestDTO[]> {

        const features = await this._getFeaturesFromDevConfig(hostname);

        const config = await this._siteConfigRepository.getById(hostname);

        const dtos: ManifestDTO[] = [];

        for (const feature of features) {
            const manifestUri = await this._nameResolver.resolve(feature.name, feature.version);
            const manifestJson = await this._resourceLoader.load(manifestUri);
            const manifest = JSON.parse(manifestJson);

            const dto = this._mapperService.map(ManifestDTO, manifest);

            dto.id = feature.name + '@' + feature.version; // ToDo: remove
            dto.dist = new URL(dto.dist, manifestUri).href;
            dto.isDev = true;
            dto.lastFeatureId = feature.name + '@' + feature.version; // ToDo: remove?
            dto.isNew = false;
            dto.isActive = config.activeFeatures[feature.name] && config.activeFeatures[feature.name].isActive;
            dto.familyId = feature.name;
            dto.version = feature.version;

            dtos.push(dto);
        }

        return dtos;
    }

    async getProdScriptsByHostname(hostname): Promise<ManifestDTO[]> {
        const featuresDto: ManifestDTO[] = [];

        let siteConfig = await this._siteConfigRepository.getById(hostname);
        if (!siteConfig) {
            await this._syncFeaturesByHostname(hostname);
            siteConfig = await this._siteConfigRepository.getById(hostname);
            if (!siteConfig) return featuresDto;
        }

        // ToDo: Sync if old?

        for (const featureFamilyId in siteConfig.featureFamilies) {
            const featureConfig = siteConfig.featureFamilies[featureFamilyId];

            const featureManifest = await this._manifestRepository.getById(featureConfig.currentFeatureId);

            const dto = new ManifestDTO();

            dto.id = featureConfig.currentFeatureId;
            dto.familyId = featureFamilyId;
            dto.name = featureManifest.name;
            dto.description = featureManifest.description;
            dto.author = featureManifest.author;
            dto.version = featureManifest.version;
            dto.icon = featureManifest.icon;
            dto.lastFeatureId = featureConfig.lastFeatureId;
            dto.isNew = featureConfig.isNew;
            dto.isActive = featureConfig.isActive;
            dto.isDev = featureManifest.isDev;
            dto.dist = featureManifest.dist;

            featuresDto.push(dto);
        }

        return featuresDto;
    }

    // #endregion

    // #region Methods for Inpage
    public async getActiveModulesByHostname(hostname: string) {
        const featureNames = await this.getFeaturesByHostname(hostname);
        const activeFeatureNames = featureNames.filter(f => f.isActive === true);
        const loadedModules = await this.getModulesWithDeps(activeFeatureNames);
        return loadedModules;
    }

    public async getModulesWithDeps(modules: {name: string, branch: string, version: string}[]) {
        const modulesWithDeps = await this._dependencyResolver.resolve(modules);
        const loadedModules = await this._loadModules(modulesWithDeps);
        return loadedModules;
    }

    // #endregion

    // #region Private methods

    public async _loadModules(modules: { name: string, branch: string, version: string }[]) {
        const manifestUris = await Promise.all(modules.map(({ name, version, branch }) => this._nameResolver.resolve(name, version, branch)));

        const loadedModules = await Promise.all(manifestUris.map(async (manifestUri) => {
            const mainfestJson = await this._resourceLoader.load(manifestUri);
            const manifest = JSON.parse(mainfestJson);
            const scriptUri = new URL(manifest.dist, manifestUri).href;
            const script = await this._resourceLoader.load(scriptUri);
            return {
                script: script,
                manifest: manifest
            };
        }));

        return loadedModules;
    }

    // ToDo: 
    private async _getFeaturesFromDevConfig(hostname: string): Promise<{ name: string, version: string, branch: string }[]> {
        const { devConfigUrl } = await this._globalConfigService.get();
        if (!devConfigUrl) return [];

        const response = await fetch(devConfigUrl + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
        if (!response.ok) {
            console.error("Cannot load dev config");
            return;
        }
        const text = await response.text();

        const config: { hostnames: { [key: string]: { [key: string]: string } }, modules: { [key: string]: { [key: string]: string } } } = JSON.parse(text);

        if (!config.hostnames[hostname]) return [];

        const modules: { name: string, version: string, branch: string }[] = [];

        for (const name in config.hostnames[hostname]) {
            const version = config.hostnames[hostname][name];
            modules.push({ name, version, branch: DEFAULT_BRANCH_NAME });
        }

        return modules;
    }

    private async _syncFeaturesByHostname(hostname: string): Promise<void> {
        const remoteFeatures = await this._dappletRegistry.getFeaturesByHostname(hostname);
        if (remoteFeatures.length == 0) return;

        let siteConfig = await this._siteConfigRepository.getById(hostname);

        let isNewConfig: boolean = false;
        if (!siteConfig) {
            siteConfig = new SiteConfig();
            siteConfig.hostname = hostname;
            siteConfig.paused = false;
            siteConfig.featureFamilies = {};
            isNewConfig = true;
        }

        for (const remote of remoteFeatures) {
            let isFound: boolean = false;
            for (let featureFamilyId in siteConfig.featureFamilies) {
                if (remote.family == featureFamilyId) {
                    // Update is available
                    if (siteConfig.featureFamilies[featureFamilyId].lastFeatureId != remote.feature) {
                        siteConfig.featureFamilies[featureFamilyId].lastFeatureId = remote.feature; // Bump version
                        siteConfig.featureFamilies[featureFamilyId].isNew = true;

                        // Auto update of inactive features
                        if (!siteConfig.featureFamilies[featureFamilyId].isActive) {
                            siteConfig.featureFamilies[featureFamilyId].currentFeatureId = remote.feature;
                        }

                        await this._syncFeatureMetadataById(remote.feature);
                    }

                    isFound = true;
                    break; // Skip adding of new feature
                }
            }

            if (!isFound) {
                siteConfig.featureFamilies[remote.family] = {
                    currentFeatureId: remote.feature,
                    lastFeatureId: remote.feature,
                    isNew: true,
                    isActive: false // inactive by default
                };

                await this._syncFeatureMetadataById(remote.feature);
            }
        }

        siteConfig.lastSync = new Date();

        if (isNewConfig) {
            await this._siteConfigRepository.create(siteConfig);
        } else {
            await this._siteConfigRepository.update(siteConfig);
        }
    }
    
    private async _syncFeatureMetadataById(id: string): Promise<void> {
        const buffer = await this._dappletRegistry.getScriptById(id);
        const file = new File();
        file.id = id;
        file.setData(buffer);
        // ToDo: fix it
        //const userscript = UserScriptHelper.extractMetablock(file.data);

        const metadata = {};
        // for (const key in userscript.meta) {
        //     metadata[key] = userscript.meta[key][0];
        // }

        const featureManifest = this._mapperService.map(Manifest, metadata);
        featureManifest.id = id;
        await this._manifestRepository.create(featureManifest);
    }

    // #endregion
}