import Base from '../../common/models/base';
import { WalletInfo } from '../../common/constants';

export class GlobalConfig extends Base {
    getId = () => this.id;

    id: string = 'default';

    registryUrl: string = null;

    suspended: boolean = false;

    walletInfo: WalletInfo = null;
}