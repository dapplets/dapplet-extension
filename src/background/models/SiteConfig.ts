import Base from './Base';

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
    lastSync: Date = null; // ToDo: Date isn't serializing to JSON. Need to fix this bug
}