const { Builder, By, Key, until, Capabilities } = require('selenium-webdriver')
const { Options } = require('selenium-webdriver/chrome')
const path = require('path')

;(async function () {
  const url = 'https://docs.dapplets.org/'

  describe('No available dapplets', () => {
    it('No available dapplets', async () => {
      // add extension
      const options = new Options().addArguments(
        '--load-extension=' + path.join(__dirname, '../build')
      )

      //open Chrome browser
      const driver = await new Builder()
        .withCapabilities(Capabilities.chrome())
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()

      try {
        // Open the browser and navigate to the URL
        await driver.get(url)

        // Open the dapplets overlay
        driver.executeScript('window.dapplets.openPopup();')

        const overlay = await driver.findElement(By.css('dapplets-overlay-manager'))
        const shadowRoot = await overlay.getShadowRoot()

        // Wait for the message about no available dapplets
        const el = await shadowRoot.findElement(By.css('[data-testid="system-tab-dapplets"]'))
        await el.click()

        await driver.sleep(3000)

        // Assertion
        await shadowRoot.findElement(
          By.xpath(`//*[contains(text(), 'No available dapplets for current site')]`)
        )
      } catch (error) {
        throw error
      } finally {
        // Close the browser
        await driver.quit()
      }
    })
  })
})()
