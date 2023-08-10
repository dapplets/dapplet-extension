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

      // execute test
      await use(undefined)

      await deactivateDapplet(dappletName)

      // widget does not exist
      await expect(page.locator('.dapplet-widget')).not.toBeVisible()
    },
  })

export { expect }
