import BaseBrowserStorage from './baseBrowserStorage'
import GlobalConfig from '../models/globalConfig'

export default class GlobalConfigBrowserStorage extends BaseBrowserStorage<GlobalConfig> { 
    constructor() {
        super(GlobalConfig);
    }
}