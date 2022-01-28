import Base from '../../common/models/base';
import { WalletInfo } from '../../common/constants';
import SiteConfig from './siteConfig';
import { EthereumNetwrokConfig, NearNetworkConfig } from '../../common/types';

export class GlobalConfig extends Base {

    getId = () => this.id;
    
    id: string = 'default';
    
    isActive: boolean = false;

    suspended: boolean = false;

    walletInfo: WalletInfo = null;

    registries: { url: string, isDev: boolean, isEnabled: boolean }[] = [];

    intro = {
        popupDeveloperWelcome: true
    };

    devMode: boolean = false;

    trustedUsers: { account: string }[] = [];

    userSettings: {
        [moduleName: string]: { [key: string]: any }
    } = {};

    errorReporting: boolean = true; // indirectly affects on '/src/common/logger.ts'

    userAgentId: string = null;

    userAgentName: string = null;

    autoBackup: boolean = true;

    providerUrl: string = null;

    swarmGatewayUrl: string = null;

    walletsUsage: { [moduleName: string]: { [chain: string]: string } } = {}; // { 'extension': { 'ethereum': 'metamask', 'near': 'near' }}

    identityContract: string = null;

    popupInOverlay: boolean = false;

    hostnames: {
        [hostname: string]: SiteConfig;
    } = {}

    lastDevMessageHash: string = null;

    ignoredUpdate: string = null;

    lastMessageSeenTimestamp: string = null;

    dynamicAdapter: string = null;

    preferedOverlayStorage: string = null;

    swarmPostageStampId: string = null;

    ipfsGatewayUrl: string = null;

    siaPortalUrl: string = null;

    ethereumNetworks: EthereumNetwrokConfig[] = [];

    nearNetworks: NearNetworkConfig[] = [];

    myDapplets: { registryUrl: string, name: string }[] = [];
}