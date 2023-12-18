import { ChainTypes, WalletTypes } from '../../common/types'
import ethereum from './ethereum'
import near_mainnet from './near/near/mainnet'
import near_testnet from './near/near/testnet'

export default {
  [ChainTypes.ETHEREUM_SEPOLIA]: ethereum,
  [ChainTypes.ETHEREUM_XDAI]: ethereum,
  [ChainTypes.NEAR_MAINNET]: { [WalletTypes.NEAR]: near_mainnet },
  [ChainTypes.NEAR_TESTNET]: { [WalletTypes.NEAR]: near_testnet },
}
