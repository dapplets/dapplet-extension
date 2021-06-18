import BaseBrowserStorage from './baseBrowserStorage'
import ModuleInfo from '../models/moduleInfo'

export default class ModuleInfoBrowserStorage extends BaseBrowserStorage<ModuleInfo> { 
    constructor() {
        super(ModuleInfo, 'ModuleInfo');
    }

    get(registryUrl: string, moduleName: string) {
        const id = registryUrl + ':' + moduleName;
        return super.getById(id);
    }
}