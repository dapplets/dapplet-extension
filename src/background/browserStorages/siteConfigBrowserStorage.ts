import BaseBrowserStorage from './baseBrowserStorage'
import SiteConfig from '../models/siteConfig'

export default class SiteConfigBrowserStorage extends BaseBrowserStorage<SiteConfig> { 
    constructor() {
        super(SiteConfig, 'SiteConfig');
    }

    async getById(id: string): Promise<SiteConfig> {
        let config = await super.getById(id);

        if (!config) {
            config = new SiteConfig();
            config.hostname = id;
            config.activeFeatures = {};
            config.paused = false;
        }

        return config;
    }
}