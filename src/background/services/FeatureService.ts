import File from '../models/File';
import ManifestDTO from '../dto/ManifestDTO';
import DappletRegistry from '../api/DappletRegistry';
import FileRepository from '../repositories/FileRepository';
import ManifestRepository from '../repositories/ManifestRepository';
import SiteConfigRepository from '../repositories/SiteConfigRepository';
import SiteConfig from '../models/SiteConfig';
import Manifest from '../models/Manifest';
import { MapperService } from 'simple-mapper';
import GlobalConfig from '../models/GlobalConfig';
import GlobalConfigService from './GlobalConfigService';
import DependencyResolver from '../utils/DependencyResolver';
import NameResolver from '../utils/NameResolver';
import ResourceLoader from '../utils/ResourceLoader';

export default class FeatureService {

    private _dappletRegistry = new DappletRegistry();
    private _fileRepository = new FileRepository();
    private _manifestRepository = new ManifestRepository();
    private _siteConfigRepository = new SiteConfigRepository();
    private _mapperService = new MapperService();
    private _globalConfigService = new GlobalConfigService();
    private _nameResolver = new NameResolver();
    private _resourceLoader = new ResourceLoader();
    private _dependencyResolver = new DependencyResolver(this._nameResolver, this._resourceLoader);

    async getScriptById(id: string): Promise<string> {
        // ToDo: get Feature
        let file = await this._fileRepository.getById(id);

        if (!file) {
            const buffer = await this._dappletRegistry.getScriptById(id);
            file = new File();
            file.id = id;
            file.setData(buffer);
            await this._fileRepository.create(file);
        }

        return file.data; // ToDo: ??? 
    }

    async getFeaturesByHostname(hostname: string): Promise<ManifestDTO[]> {
        let featuresDto: ManifestDTO[] = [];

        const devFeatures = await this.getDevScriptsByHostname(hostname);
        featuresDto = featuresDto.concat(devFeatures);

        let siteConfig = await this._siteConfigRepository.getById(hostname);
        if (!siteConfig) {
            await this.syncFeaturesByHostname(hostname);
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

    async syncFeaturesByHostname(hostname: string): Promise<void> {
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

    async getActiveFeatureIdsByHostname(hostname: string): Promise<string[]> {

        const { suspended } = await this._globalConfigService.get();
        if (suspended) return [];

        let activeFeatures: string[] = [];
        const featuresDto = await this.getDevScriptsByHostname(hostname);
        activeFeatures = featuresDto.map(f => f.id);

        const siteConfig = await this._siteConfigRepository.getById(hostname);
        if (!siteConfig || siteConfig.paused) return activeFeatures;

        for (const featureFamilyId in siteConfig.featureFamilies) {
            if (siteConfig.featureFamilies[featureFamilyId].isActive) {
                activeFeatures.push(siteConfig.featureFamilies[featureFamilyId].currentFeatureId);
            }
        }

        return activeFeatures;
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

    async activateFeature(id, hostname): Promise<void> {
        const featureManifest = await this._manifestRepository.getById(id);
        const config = await this._siteConfigRepository.getById(hostname);

        // TODO: null checking

        config.featureFamilies[featureManifest.familyId].isActive = true;

        await this._siteConfigRepository.update(config);

        // ToDo: save file to storage
        // ToDo: fire activate event to inpage module
    }

    async deactivateFeature(id, hostname): Promise<void> {
        const featureManifest = await this._manifestRepository.getById(id);
        const config = await this._siteConfigRepository.getById(hostname);

        // ToDo: null checking

        config.featureFamilies[featureManifest.familyId].isActive = false;

        await this._siteConfigRepository.update(config);

        // ToDo: remove file from storage
        // ToDo: fire deactivate event to inpage module
    }

    async getDevScriptsByHostname(hostname): Promise<ManifestDTO[]> {

        const activeFeatures = await this._getActiveDevFeaturesByHostname(hostname);

        const dtos: ManifestDTO[] = [];

        for (const feature of activeFeatures) {
            const manifestUri = await this._nameResolver.resolve(feature.name, feature.version);
            const manifestJson = await this._resourceLoader.load(manifestUri);
            const manifest = JSON.parse(manifestJson);

            const dto = this._mapperService.map(ManifestDTO, manifest);

            dto.id = feature.name + '@' + feature.version;
            dto.dist = new URL(dto.dist, manifestUri).href;
            dto.isDev = true;
            dto.lastFeatureId = feature.name + '@' + feature.version;
            dto.isNew = false;
            dto.isActive = true;
            dto.familyId = feature.name;
            dto.version = feature.version;

            dtos.push(dto);
        }

        return dtos;
    }


    public async getActiveModulesByHostname(hostname: string) {
        const activeFeaturesNames = await this._getActiveDevFeaturesByHostname(hostname);
        const activeFeatures = await this._dependencyResolver.resolve(activeFeaturesNames);
        const manifestUris = await Promise.all(activeFeatures.map(({ name, version }) => this._nameResolver.resolve(name, version)));


        const modules = await Promise.all(manifestUris.map(async (manifestUri) => {
            const mainfestJson = await this._resourceLoader.load(manifestUri);
            const manifest = this._mapperService.map(Manifest, JSON.parse(mainfestJson));
            const scriptUri = new URL(manifest.dist, manifestUri).href;
            const script = await this._resourceLoader.load(scriptUri);
            return {
                name: manifest.name,
                version: manifest.version,
                script: script,
                type: manifest.type
            };
        }));

        return modules;
    }

    private async _getActiveDevFeaturesByHostname(hostname: string): Promise<{ name: string, version: string }[]> {
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

        const modules: { name: string, version: string }[] = [];

        for (const name in config.hostnames[hostname]) {
            const version = config.hostnames[hostname][name];
            modules.push({ name: name, version });
        }

        return modules;
    }
}