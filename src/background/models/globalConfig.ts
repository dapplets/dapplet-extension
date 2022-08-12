import { StorageTypes, WalletInfo } from '../../common/constants'
import Base from '../../common/models/base'
import { EthereumNetwrokConfig, NearNetworkConfig } from '../../common/types'
import SiteConfig from './siteConfig'

export class GlobalConfig extends Base {
  getId = () => this.id

  id = 'default'

  isActive = false

  suspended = false

  walletInfo: WalletInfo = null

  registries: { url: string; isDev: boolean; isEnabled: boolean }[] = []

  intro = {
    popupDeveloperWelcome: true,
  }

  devMode = false

  trustedUsers: { account: string }[] = []

  userSettings: {
    [moduleName: string]: { [key: string]: any }
  } = {}
  targetStorages: StorageTypes[] = []

  errorReporting = true // indirectly affects on '/src/common/logger.ts'

  userAgentId: string = null

  userAgentName: string = null

  autoBackup = true

  providerUrl: string = null

  xdaiProviderUrl: string = null

  swarmGatewayUrl: string = null

  walletsUsage: { [moduleName: string]: { [chain: string]: string } } = {} // { 'extension': { 'ethereum': 'metamask', 'near': 'near' }}

  identityContract: string = null

  popupInOverlay = false

  hostnames: {
    [hostname: string]: SiteConfig
  } = {}

  lastDevMessageHash: string = null

  ignoredUpdate: string = null

  lastMessageSeenTimestamp: string = null

  dynamicAdapter: string = null

  preferedOverlayStorage: string = null

  swarmPostageStampId: string = null

  ipfsGatewayUrl: string = null

  siaPortalUrl: string = null

  ethereumNetworks: EthereumNetwrokConfig[] = []

  nearNetworks: NearNetworkConfig[] = []

  myDapplets: { registryUrl: string; name: string }[] = []

  connectedAccountsContractAddress: string = null
}
