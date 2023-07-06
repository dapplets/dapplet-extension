import { WalletTypes } from '../../../common/types'
import dapplets from './dapplets'
import metamask from './metamask'
// import walletconnect from './walletconnect'

export default {
  [WalletTypes.METAMASK]: metamask,
  [WalletTypes.DAPPLETS]: dapplets,
  // ToDo: migrate to WalletConnect v2
  // [WalletTypes.WALLETCONNECT]: walletconnect,
}
