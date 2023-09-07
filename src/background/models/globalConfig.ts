import { StorageTypes, WalletInfo } from '../../common/constants'
import Base from '../../common/models/base'
import { EthereumNetwrokConfig, NearNetworkConfig, NearNetworks } from '../../common/types'
import SiteConfig from './siteConfig'

export class GlobalConfig extends Base {
  getId = () => this.id

  id = 'default'

  isActive = false

  suspended = false

  isFirstInstallation = true

  walletInfo: WalletInfo = null

  registries: { url: string; isDev: boolean; isEnabled: boolean }[] = []

  devMode = false

  trustedUsers: { account: string }[] = []

  userSettings: {
    [moduleName: string]: { [key: string]: string | number | boolean | null | undefined }
  } = {}

  targetStorages: StorageTypes[] = []

  errorReporting = true // indirectly affects on '/src/common/logger.ts'

  userTracking = true

  userAgentId: string = null

  userAgentName: string = null

  providerUrl: string = null

  xdaiProviderUrl: string = null

  swarmGatewayUrl: string = null

  walletsUsage: { [moduleName: string]: { [chain: string]: string } } = {} // { 'extension': { 'ethereum': 'metamask', 'near': 'near' }}

  hostnames: {
    [hostname: string]: SiteConfig
  } = {}

  lastDevMessageHash: string = null

  ignoredUpdate: string = null

  lastMessageSeenTimestamp: string = null

  preferedOverlayStorage: string = null

  swarmPostageStampId: string = null

  ipfsGatewayUrl: string = null

  ethereumNetworks: EthereumNetwrokConfig[] = []

  nearNetworks: NearNetworkConfig[] = []

  myDapplets: { registryUrl: string; name: string }[] = []

  connectedAccountsTestnetContractAddress: string = null

  connectedAccountsMainnetContractAddress: string = null

  preferredConnectedAccountsNetwork: NearNetworks = null

  pinnedDappletActions: { dappletName: string; widgetPinId: string }[] = []

  mutation: string = null
}
