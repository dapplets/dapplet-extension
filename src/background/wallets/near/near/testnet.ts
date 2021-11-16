import NearWallet from './index';

export default class TestnetNearWallet extends NearWallet {
    constructor() {
        super({
            networkId: 'testnet',
            nodeUrl: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
        });
    }

    override async getMeta() {
        return {
            name: 'NEAR Wallet (Testnet)',
            description: 'NEAR Wallet (Testnet)',
            icon: 'https://near.org/wp-content/themes/near-19/assets/downloads/near_icon.svg'
        }
    }
}