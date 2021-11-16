import metamask from './metamask';
import walletconnect from './walletconnect';
import dapplets from './dapplets';
import { WalletTypes } from '../../../common/types';

export default {
    [WalletTypes.METAMASK]: metamask,
    [WalletTypes.WALLETCONNECT]: walletconnect,
    [WalletTypes.DAPPLETS]: dapplets
}