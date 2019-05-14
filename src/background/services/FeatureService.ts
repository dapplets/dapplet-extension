import DappletRegistry from '../api/DappletRegistry';
import FileRepository from '../repositories/FileRepository';
import File from '../models/File';
import FeatureRepository from '../repositories/FeatureRepository';
import SiteConfigRepository from '../repositories/SiteConfigRepository';
import FeatureDTO from '../dto/FeatureDTO';

export default class FeatureService {

    private _dappletRegistry = new DappletRegistry();
    private _fileRepository = new FileRepository();
    private _featureRepository = new FeatureRepository();
    private _siteConfigRepository = new SiteConfigRepository();

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

    async getFeaturesByHostname(hostname: string): Promise<FeatureDTO[]> {
        const siteConfig = await this._siteConfigRepository.getById(hostname);

        const featuresDto : FeatureDTO[] = [];

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
        const siteConfig = await this._siteConfigRepository.getById(hostname);

        for (const remote of remoteFeatures) {
            for (const featureFamilyId in siteConfig.featureFamilies) {
                if (remote.family == featureFamilyId) {
                    // Update is available
                    if (siteConfig.featureFamilies[featureFamilyId].lastFeatureId != remote.feature) {
                        siteConfig.featureFamilies[featureFamilyId].lastFeatureId = remote.feature; // Bump version
                        siteConfig.featureFamilies[featureFamilyId].isNew = true;

                        // Auto update of inactive features
                        if (!siteConfig.featureFamilies[featureFamilyId].isActive) {
                            siteConfig.featureFamilies[featureFamilyId].currentFeatureId = remote.feature;
                        }
                    }

                    continue; // Skip adding of new feature
                }

                siteConfig.featureFamilies[featureFamilyId] = {
                    currentFeatureId: remote.feature,
                    lastFeatureId: remote.feature,
                    isNew: true,
                    isActive: false // inactive by default
                };
            }
        }

        await this._siteConfigRepository.update(siteConfig);        
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

    // async setActiveInjector(injector: Injector) : Prmise<string> {

    // }
}