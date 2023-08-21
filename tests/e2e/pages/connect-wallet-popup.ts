import { Locator, Page } from '@playwright/test'

export enum WalletTypes {
  BuiltIn = 'dapplets_goerli',
  NearMainnet = 'near_mainnet',
  NearTestnet = 'near_testnet',
}

export class ConnectWalletPopup {
  public readonly root: Locator

  constructor(public readonly page: Page) {
    this.root = this.page.getByTestId('connect-wallet-to-extension-popup')
  }

  async connectWallet(walletType: WalletTypes) {
    await this.root.getByTestId(`wallet-to-connect-${walletType}`).click()
  }
}
