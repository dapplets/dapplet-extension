import { Locator, Page } from '@playwright/test'

export class LoginModal {
  public readonly root: Locator

  constructor(public readonly page: Page) {
    this.root = this.page.getByTestId('profile-modal-login')
  }

  async clickAddWallet() {
    await this.root.getByTestId('add-wallet-btn-profile-widget').click()
  }
}
