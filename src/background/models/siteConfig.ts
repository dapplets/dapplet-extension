import Base from '../../common/models/base';

// ToDo: It should be UserConfig
export default class SiteConfig extends Base {
    getId = () => this.hostname;

    hostname: string = null;

    activeFeatures: {
        [name: string]: {
            version: string;
            isActive: boolean;
        }
    } = {};

    paused: boolean = null;
}