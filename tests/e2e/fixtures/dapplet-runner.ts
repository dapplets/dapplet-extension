import { Dapplets } from '../pages/dapplets'
import { Developer } from '../pages/developer'
import { Overlay } from '../pages/overlay'
import { Settings } from '../pages/settings'
import { test as base } from './browser'

type DappletRunnerFixtures = {
  skipOnboarding(): Promise<void>
  enableDevMode(): Promise<void>
  disableDevMode(): Promise<void>
  enableDevServer(devServerUrl: string): Promise<void>
  activateDapplet(dappletName: string, registryUrl: string): Promise<void>
  deactivateDapplet(dappletName: string, registryUrl: string): Promise<void>
  enableDevServerViaUI(devServerUrl: string): Promise<void>
  activateDappletViaUI(dappletName: string): Promise<void>
  deactivateDappletViaUI(dappletName: string): Promise<void>
}

export const test = base.extend<DappletRunnerFixtures>({
  enableDevMode: async ({ background }, use) => {
    await use(async () => {
      await background.evaluate(() => globalThis.dapplets.enableDevMode())
    })
  },
  disableDevMode: async ({ background }, use) => {
    await use(async () => {
      await background.evaluate(() => globalThis.dapplets.disableDevMode())
    })
  },
  skipOnboarding: async ({ background }, use) => {
    await use(async () => {
      await background.evaluate(() => globalThis.dapplets.setIsFirstInstallation(false))
    })
  },
  enableDevServer: async ({ background }, use) => {
    await use(async (devServerUrl) => {
      await background.evaluate(
        (devServerUrl) => globalThis.dapplets.addRegistry(devServerUrl, true),
        devServerUrl
      )
      await background.evaluate(
        (devServerUrl) => globalThis.dapplets.enableRegistry(devServerUrl),
        devServerUrl
      )
    })
  },
  activateDapplet: async ({ background }, use) => {
    await use(async (name, registryUrl) => {
      await background.evaluate((params) => globalThis.dapplets.activateDapplet(params), {
        name,
        registryUrl,
      })
    })
  },
  deactivateDapplet: async ({ background }, use) => {
    await use(async (name, registryUrl) => {
      await background.evaluate((params) => globalThis.dapplets.deactivateDapplet(params), {
        name,
        registryUrl,
      })
    })
  },
  enableDevServerViaUI: async ({ page }, use) => {
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
  activateDappletViaUI: async ({ page }, use) => {
    await use(async (dappletName) => {
      const overlay = new Overlay(page)
      const dapplets = new Dapplets(page)

      await overlay.clickToggle()
      await dapplets.activateDapplet(dappletName)
      await overlay.clickToggle()
    })
  },
  deactivateDappletViaUI: async ({ page }, use) => {
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
