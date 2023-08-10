import type { Locator, Page } from '@playwright/test'

export class Dapplets {
  private readonly overlay: Locator

  constructor(public readonly page: Page) {
    this.overlay = this.page.locator('#dapplets-overlay-manager')
  }

  async activateDapplet(dappletName: string) {
    await this.overlay
      .getByTestId(dappletName)
      .locator('[data-testid=activation-dapplet].not-active-switch')
      .click()

    await this.page.waitForEvent('console', (msg) => {
      const text = msg.text()
      return text.includes(dappletName) && text.includes('is loaded')
    })
  }

  async deactivateDapplet(dappletName: string) {
    await this.overlay
      .getByTestId(dappletName)
      .locator('[data-testid=activation-dapplet].active-switch')
      .click()

    await this.page.waitForEvent('console', (msg) => {
      const text = msg.text()
      return text.includes(dappletName) && text.includes('is unloaded')
    })
  }
}
