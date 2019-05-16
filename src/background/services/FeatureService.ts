import File from '../models/File';
import FeatureDTO from '../dto/FeatureDTO';
import DappletRegistry from '../api/DappletRegistry';
import FileRepository from '../repositories/FileRepository';
import ManifestRepository from '../repositories/ManifestRepository';
import SiteConfigRepository from '../repositories/SiteConfigRepository';
import SiteConfig from '../models/SiteConfig';
import UserScriptHelper from '../utils/UserScriptHelper';
import Manifest from '../models/Manifest';
import { MapperService } from 'simple-mapper';

export default class FeatureService {

    private _dappletRegistry = new DappletRegistry();
    private _fileRepository = new FileRepository();
    private _manifestRepository = new ManifestRepository();
    private _siteConfigRepository = new SiteConfigRepository();
    private _mapperService = new MapperService();

    constructor() {
        console.log('FeatureService', this);
    }

    async getScriptById(id: string): Promise<string> {
        const manifest = await this._manifestRepository.getById(id);
        
        if (manifest && manifest.isDev === true) {
            // TODO: cache prevent like [here](https://stackoverflow.com/questions/29246444/fetch-how-do-you-make-a-non-cached-request)
            const response = await fetch(manifest.devUrl + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
            if (!response.ok) throw new Error("Can not load remote injector");
            const text = await response.text();
            return text;
        } else {
            // TODO: get Feature
            let file = await this._fileRepository.getById(id);

            if (!file) {
                const buffer = await this._dappletRegistry.getScriptById(id);
                file = new File();
                file.id = id;
                file.setData(buffer);
                await this._fileRepository.create(file);
            }
            
            return file.data; // ToDo ??? 
        }
    }

    async getFeaturesByHostname(hostname: string, isOnlyDev?: boolean): Promise<FeatureDTO[]> {
        let siteConfig = await this._siteConfigRepository.getById(hostname);

        const featuresDto: FeatureDTO[] = [];

        if (!siteConfig) {
            await this.syncFeaturesByHostname(hostname);
            siteConfig = await this._siteConfigRepository.getById(hostname);
            if (!siteConfig) return [];
        }

        // TODO: Sync if old?

        for (const featureFamilyId in siteConfig.featureFamilies) {
            const featureConfig = siteConfig.featureFamilies[featureFamilyId];

            const featureManifest = await this._manifestRepository.getById(featureConfig.currentFeatureId);
            if (isOnlyDev === true && featureManifest.isDev !== true) continue;

            const dto = new FeatureDTO();

            dto.id = featureConfig.currentFeatureId;
            dto.featureFamilyId = featureFamilyId;
            dto.name = featureManifest.name;
            dto.description = featureManifest.description;
            dto.author = featureManifest.author;
            dto.version = featureManifest.version;
            dto.icon = featureManifest.icon;
            dto.lastFeatureId = featureConfig.lastFeatureId;
            dto.isNew = featureConfig.isNew;
            dto.isActive = featureConfig.isActive;
            dto.isDev = featureManifest.isDev;
            dto.devUrl = featureManifest.devUrl;

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
        const siteConfig = await this._siteConfigRepository.getById(hostname);
        if (!siteConfig) return [];

        const activeFeatures: string[] = [];

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
        const userscript = UserScriptHelper.extractMetablock(file.data);

        const metadata = {};
        for (const key in userscript.meta) {
            metadata[key] = userscript.meta[key][0];
        }

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

        // TODO: save file to storage
        // TODO: fire activate event to inpage module
    }

    async deactivateFeature(id, hostname): Promise<void> {
        const featureManifest = await this._manifestRepository.getById(id);
        const config = await this._siteConfigRepository.getById(hostname);

        // TODO: null checking

        config.featureFamilies[featureManifest.familyId].isActive = false;

        await this._siteConfigRepository.update(config);

        // TODO: remove file from storage
        // TODO: fire deactivate event to inpage module
    }

    async addDevScript(id, url, hostname): Promise<void> {
        // TODO: cache prevent like [here](https://stackoverflow.com/questions/29246444/fetch-how-do-you-make-a-non-cached-request)
        const response = await fetch(url + '?_dc=' + (new Date).getTime()); // _dc is for cache preventing
        if (!response.ok) throw new Error("Can not load remote injector");
        const text = await response.text();
        const userscript = UserScriptHelper.extractMetablock(text);

        const metadata = {};
        for (const key in userscript.meta) {
            metadata[key] = userscript.meta[key][0];
        }

        const manifest = this._mapperService.map(Manifest, metadata);

        if (!manifest.familyId) throw new Error("Family ID is needed");

        manifest.id = id;
        manifest.devUrl = url;
        manifest.isDev = true;

        if (manifest.type === 'feature') {
            let siteConfig = await this._siteConfigRepository.getById(hostname);
            let isNewConfig: boolean = false;
            if (!siteConfig) {
                siteConfig = new SiteConfig();
                siteConfig.hostname = hostname;
                siteConfig.paused = false;
                siteConfig.featureFamilies = {};
                isNewConfig = true;
            }
    
            siteConfig.featureFamilies[manifest.familyId] = {
                currentFeatureId: id,
                lastFeatureId: id,
                isActive: false,
                isNew: false
            };
    
            if (isNewConfig) {
                await this._siteConfigRepository.create(siteConfig);
            } else {
                await this._siteConfigRepository.update(siteConfig);
            }
        }        

        await this._manifestRepository.create(manifest);        
    }

    async deleteDevScript(id, hostname): Promise<void> {
        const featureManifest = await this._manifestRepository.getById(id);
        if (!featureManifest) throw new Error('Dev feature metadata is not found.');

        let siteConfig = await this._siteConfigRepository.getById(hostname);
        if (siteConfig) {
            delete siteConfig.featureFamilies[featureManifest.familyId];
            await this._siteConfigRepository.update(siteConfig);
        }

        await this._manifestRepository.delete(featureManifest);
    }
}