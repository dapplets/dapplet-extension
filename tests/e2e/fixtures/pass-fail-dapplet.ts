import { expect, test as base } from './dapplet-runner'

type TestableDappletParams = {
  devServerUrl: string
  dappletName: string
}

export const test = ({ devServerUrl, dappletName }: TestableDappletParams) =>
  base.extend({
    testableDapplet: async (
      { page, skipOnboarding, enableDevServer, activateDapplet, deactivateDapplet },
      use
    ) => {
      // open context webpage
      await page.goto('/')

      // widget does not exist
      await expect(page.locator('.dapplet-widget')).not.toBeVisible()

      await skipOnboarding()
      await enableDevServer(devServerUrl)
      await activateDapplet(dappletName, devServerUrl)

      // execute test
      await use(undefined)

      await deactivateDapplet(dappletName, devServerUrl)

      // widget does not exist
      await expect(page.locator('.dapplet-widget')).not.toBeVisible()
    },
  })

export { expect }
