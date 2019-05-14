import Base from './Base';

export default class SiteConfig extends Base {
    getId = () => this.hostname;

    hostname: string;
    featureFamilies: {
        [key: string]: {
            currentFeatureId: string;
            lastFeatureId: string;
            isActive: boolean;
            isNew: boolean;
        };
    };
    paused: boolean;
    lastSync: Date;
}