import { expect, test as base } from './dapplet-runner'

type TestableDappletParams = {
  devServerUrl: string
  dappletName: string
}

export const test = ({ devServerUrl, dappletName }: TestableDappletParams) =>
  base.extend({
    testableDapplet: async ({ page, enableDevServer, activateDapplet, deactivateDapplet }, use) => {
      // open context webpage
      await page.goto('/')

      // widget does not exist
      await expect(page.locator('.dapplet-widget')).not.toBeVisible()

      await enableDevServer(devServerUrl)
      await activateDapplet(dappletName)

      // widget exists
      await expect(page.locator('.dapplet-widget')).toBeVisible()

      await page.locator('.dapplet-widget').locator(':scope > *').first().click()
      await use(undefined)

      await deactivateDapplet(dappletName)

      // widget does not exist
      await expect(page.locator('.dapplet-widget')).not.toBeVisible()
    },
  })

export { expect }
