import type { Locator, Page } from '@playwright/test'

export class Overlay {
  public readonly root: Locator
  public readonly profile: Locator

  constructor(public readonly page: Page) {
    this.root = this.page.locator('#dapplets-overlay-manager')
    this.profile = this.page.getByTestId('profile-widget')
  }

  async goto() {
    // emulate extension icon click
    await this.page.waitForFunction(() => !!window['dapplets'])
    await this.page.evaluate('window.dapplets.openPopup()')
  }

  async clickToggle() {
    await this.root.getByTestId('system-tab-dapplets').first().click()
  }

  async clickSettings() {
    await this.root.getByTestId('system-tab-settings').click()
  }

  async skipTutorial() {
    await this.root.getByTestId('skip-tutorial').click()
  }

  async clickProfile() {
    await this.profile.click()
  }

  async clickNotifications() {
    await this.root.getByTestId('notification-button').click()
  }
}
