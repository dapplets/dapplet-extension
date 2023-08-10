import type { Locator, Page } from '@playwright/test'

export class Notifications {
  private readonly overlay: Locator
  public readonly root: Locator

  constructor(public readonly page: Page) {
    this.overlay = this.page.locator('#dapplets-overlay-manager')
    this.root = this.overlay.getByTestId('notification')
  }
}
