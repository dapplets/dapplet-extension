import Base from './Base';

// ToDo: It should be UserConfig
export default class SiteConfig extends Base {
    getId = () => this.hostname;

    hostname: string = null;

    // ToDo: remove featureFamilies
    featureFamilies: {
        [key: string]: {
            currentFeatureId: string;
            lastFeatureId: string;
            isActive: boolean;
            isNew: boolean;
        };
    } = {};

    activeFeatures: {
        [name: string]: {
            version: string;
            isActive: boolean;
        }
    } = {};

    paused: boolean = null;

    lastSync: Date = null; // ToDo: Date isn't serializing to JSON. Need to fix this bug
}