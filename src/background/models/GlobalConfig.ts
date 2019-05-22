import Base from './Base';

// ToDo: Unused model?
export default class SiteConfig extends Base {
    getId = () => this.hostname;

    hostname: string = null;
    featureFamilies: {
        [key: string]: {
            currentFeatureId: string;
            lastFeatureId: string;
            isActive: boolean;
            isNew: boolean;
        };
    } = {};
    paused: boolean = null;
    lastSync: Date = null;
}