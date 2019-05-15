import File from '../models/File';
import FeatureDTO from '../dto/FeatureDTO';
import DappletRegistry from '../api/DappletRegistry';
import FileRepository from '../repositories/FileRepository';
import FeatureRepository from '../repositories/FeatureRepository';
import SiteConfigRepository from '../repositories/SiteConfigRepository';
import SiteConfig from '../models/SiteConfig';
import UserScriptHelper from '../utils/UserScriptHelper';
import Feature from '../models/Feature';
import { MapperService } from 'simple-mapper';

export default class FeatureService {

    private _dappletRegistry = new DappletRegistry();
    private _fileRepository = new FileRepository();
    private _featureRepository = new FeatureRepository();
    private _siteConfigRepository = new SiteConfigRepository();
    private _mapperService = new MapperService();

    constructor() {
        console.log('FeatureService', this);
    }

    async getFeatureScriptById(id: string): Promise<string> {
        let file = await this._fileRepository.getById(id);

        if (!file) {
            const buffer = await this._dappletRegistry.getFeatureFileById(id);
            file = new File();
            file.id = id;
            file.setData(buffer);
            await this._fileRepository.create(file);
        }

        return file.data; // ToDo ??? 
    }

    async getAdapterScriptById(id: string): Promise<string> {
        let file = await this._fileRepository.getById(id);

        if (!file) {
            const buffer = await this._dappletRegistry.getAdapterFileById(id);
            file = new File();
            file.id = id;
            file.setData(buffer);
            await this._fileRepository.create(file);
        }

        return file.data; // ToDo ??? 
    }

    async getFeaturesByHostname(hostname: string): Promise<FeatureDTO[]> {
        const siteConfig = await this._siteConfigRepository.getById(hostname);

        const featuresDto : FeatureDTO[] = [];

        if (!siteConfig) return featuresDto;

        for (const featureFamilyId in siteConfig.featureFamilies) {
            const featureConfig = siteConfig.featureFamilies[featureFamilyId];
            const dto = new FeatureDTO(); 
            const feature = await this._featureRepository.getById(featureConfig.currentFeatureId);

            dto.id = featureConfig.currentFeatureId;
            dto.featureFamilyId = featureFamilyId;
            dto.name = feature.name;
            dto.description = feature.description;
            dto.author = feature.author;
            dto.version = feature.version;
            dto.icon = feature.icon;
            dto.lastFeatureId = featureConfig.lastFeatureId;
            dto.isNew = featureConfig.isNew;
            dto.isActive = featureConfig.isActive;            

            featuresDto.push(dto);
        }

        return featuresDto;
    }

    async syncFeaturesByHostname(hostname: string): Promise<void> {
        const remoteFeatures = await this._dappletRegistry.getFeaturesByHostname(hostname);
        let siteConfig = await this._siteConfigRepository.getById(hostname);

        let isNewConfig : boolean = false;
        if (!siteConfig) {
            siteConfig = new SiteConfig();
            siteConfig.hostname = hostname;
            siteConfig.paused = false;
            siteConfig.featureFamilies = {};
            isNewConfig = true;
        }

        for (const remote of remoteFeatures) {
            let isFound : boolean = false;
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

    async getActiveFeatureIdsByHostname(hostname: string) : Promise<string[]> {
        const siteConfig = await this._siteConfigRepository.getById(hostname);
        const activeFeatures : string[] = [];

        for (const featureFamilyId in siteConfig.featureFamilies) {
            if (siteConfig.featureFamilies[featureFamilyId].isActive) {
                activeFeatures.push(siteConfig.featureFamilies[featureFamilyId].currentFeatureId);
            }
        }

        return activeFeatures;
    }

    private async _syncFeatureMetadataById(id: string) : Promise<void> {
        const buffer = await this._dappletRegistry.getFeatureFileById(id);
        const file = new File();
        file.id = id;
        file.setData(buffer);
        const userscript = UserScriptHelper.extractMetablock(file.data);

        const metadata = {};
        for (const key in userscript.meta) {
            metadata[key] = userscript.meta[key][0];
        }

        const feature = this._mapperService.map(Feature, metadata);
        feature.id = id;
        await this._featureRepository.create(feature);
    }

    async activateFeature(id, hostname) : Promise<void> {
        const feature = await this._featureRepository.getById(id);
        const config = await this._siteConfigRepository.getById(hostname);

        // TODO: null checking

        config.featureFamilies[feature.featureFamilyId].isActive = true;

        await this._siteConfigRepository.update(config);

        // TODO: save file to storage
        // TODO: fire activate event to inpage module
    }

    async deactivateFeature(id, hostname) : Promise<void> {
        const feature = await this._featureRepository.getById(id);
        const config = await this._siteConfigRepository.getById(hostname);

        // TODO: null checking

        config.featureFamilies[feature.featureFamilyId].isActive = false;

        await this._siteConfigRepository.update(config);

        // TODO: remove file from storage
        // TODO: fire deactivate event to inpage module
    }
}