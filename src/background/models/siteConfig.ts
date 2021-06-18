import Base from '../../common/models/base';
import ModuleInfo from './moduleInfo';

// ToDo: It should be UserConfig
export default class SiteConfig extends Base {
    getId = () => this.hostname;

    hostname: string = null;

    activeFeatures: {
        [name: string]: {
            version: string;
            isActive: boolean;
            order: number;
            runtime: { isActionHandler: boolean } & any;
            //moduleInfo: ModuleInfo;
            registryUrl: string;
        }
    } = {};

    paused: boolean = null;
}