import * as walletIcons from '../../../../common/resources/wallets'
import NearWallet from './index'

export default class TestnetNearWallet extends NearWallet {
  constructor() {
    super({
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://testnet.mynearwallet.com',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
    })
  }

  override async getMeta() {
    return {
      name: 'MyNearWallet (Testnet)',
      description: 'MyNearWallet (Testnet)',
      icon: walletIcons['near'],
    }
  }
}
