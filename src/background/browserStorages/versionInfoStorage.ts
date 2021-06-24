import BaseBrowserStorage from './baseBrowserStorage'
import VersionInfo from '../models/versionInfo'
import { DEFAULT_BRANCH_NAME } from '../../common/constants';

export default class VersionInfoBrowserStorage extends BaseBrowserStorage<VersionInfo> { 
    constructor() {
        super(VersionInfo, 'VersionInfo');
    }

    get(registryUrl: string, name: string, branch: string, version: string) {
        if (!branch) branch = DEFAULT_BRANCH_NAME;
        const id = registryUrl + ':' + name + '#' + branch + '@' + version;
        return super.getById(id);
    }
}