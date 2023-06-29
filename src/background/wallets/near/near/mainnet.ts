import NearWallet from './index'
import * as walletIcons from '../../../../common/resources/wallets'

export default class MainnetNearWallet extends NearWallet {
  constructor() {
    super({
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
    })
  }

  override async getMeta() {
    return {
      name: 'NEAR Wallet (Mainnet)',
      description: 'NEAR Wallet (Mainnet)',
      icon: walletIcons['near'],
    }
  }
}
