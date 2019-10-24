import Base from './base';
import { DappletCompatibility } from '../../common/constants';

export class GlobalConfig extends Base {
    getId = () => this.id;

    id: string = 'default';

    registryUrl: string = null;

    suspended: boolean = false;

    dappletCompatibility: DappletCompatibility = null;
}