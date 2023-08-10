import { Dapplets } from '../pages/dapplets'
import { Developer } from '../pages/developer'
import { Overlay } from '../pages/overlay'
import { Settings } from '../pages/settings'
import { test as base } from './browser'

type DappletRunnerFixtures = {
  enableDevServer(devServerUrl: string): Promise<void>
  activateDapplet(dappletName: string): Promise<void>
  deactivateDapplet(dappletName: string): Promise<void>
}

export const test = base.extend<DappletRunnerFixtures>({
  enableDevServer: async ({ page }, use) => {
    await use(async (devServerUrl) => {
      const overlay = new Overlay(page)
      const settings = new Settings(page)
      const developer = new Developer(page)

      await overlay.goto()
      await overlay.skipTutorial()
      await overlay.clickToggle()
      await overlay.clickSettings()
      await settings.clickDeveloperTab()
      await developer.enableServer(devServerUrl)
      await overlay.clickToggle() // open dapplets page
      await overlay.clickToggle() // collapse overlay
    })
  },
  activateDapplet: async ({ page }, use) => {
    await use(async (dappletName) => {
      const overlay = new Overlay(page)
      const dapplets = new Dapplets(page)

      await overlay.clickToggle()
      await dapplets.activateDapplet(dappletName)
      await overlay.clickToggle()
    })
  },
  deactivateDapplet: async ({ page }, use) => {
    await use(async (dappletName) => {
      const overlay = new Overlay(page)
      const dapplets = new Dapplets(page)

      await overlay.clickToggle()
      await dapplets.deactivateDapplet(dappletName)
      await overlay.clickToggle()
    })
  },
})

export { expect } from '@playwright/test'
