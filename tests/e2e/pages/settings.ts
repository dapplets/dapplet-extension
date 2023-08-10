import type { Locator, Page } from '@playwright/test'

export class Settings {
  private readonly overlay: Locator
  private readonly developerTab: Locator

  constructor(public readonly page: Page) {
    this.overlay = this.page.locator('#dapplets-overlay-manager')
    this.developerTab = this.overlay.getByTestId('settings-page-developer')
  }

  async clickDeveloperTab() {
    await this.developerTab.click()
  }
}
