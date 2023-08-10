import type { Locator, Page } from '@playwright/test'

export class Developer {
  private readonly overlay: Locator

  constructor(public readonly page: Page) {
    this.overlay = this.page.locator('#dapplets-overlay-manager')
  }

  async enableServer(url: string) {
    await this.overlay
      .getByTestId('dev-server')
      .filter({ hasText: url })
      .locator('button', { hasText: 'Disabled' })
      .click()
  }
}
