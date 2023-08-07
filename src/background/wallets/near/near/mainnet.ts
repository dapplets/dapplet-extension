import * as walletIcons from '../../../../common/resources/wallets'
import NearWallet from './index'

export default class MainnetNearWallet extends NearWallet {
  constructor() {
    super({
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      walletUrl: 'https://app.mynearwallet.com',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.near.org',
    })
  }

  override async getMeta() {
    return {
      name: 'MyNearWallet (Mainnet)',
      description: 'MyNearWallet (Mainnet)',
      icon: walletIcons['near'],
    }
  }
}
