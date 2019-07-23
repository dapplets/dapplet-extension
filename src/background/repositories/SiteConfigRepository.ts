import BaseRepository from './BaseRepository'
import SiteConfig from '../models/SiteConfig'
import { basename } from 'path';

export default class SiteConfigRepository extends BaseRepository<SiteConfig> { 
    constructor() {
        super(SiteConfig);
    }

    async getById(id: string): Promise<SiteConfig> {
        let config = await super.getById(id);

        if (!config) {
            config = new SiteConfig();
            config.hostname = id;
            config.activeFeatures = {};
            config.paused = false;
            await super.create(config);
            config = await super.getById(id);
        }

        return config;
    }
}