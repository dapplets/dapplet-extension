// import { qase } from 'cypress-qase-reporter/dist/mocha'
import path from 'path'
import { createFixture } from 'playwright-webextext'

const { test, expect } = createFixture(path.join(__dirname, '../../build'))

const urlToOpen = 'https://example.com'
const dappletIdToActivate = 'test-common-dapplet.dapplet-base.eth'
const dappletNameToActivate = 'Test Common Adapter'
const devServerUrl = 'http://localhost:3000/dapplet.json'

test(dappletNameToActivate, async ({ page }) => {
  // qase(
  // 144,
  // it(dappletNameToActivate, () => {
  // open overlay
  await page.goto(urlToOpen)
  await page.waitForFunction(() => !!window['dapplets'])
  await page.evaluate('window.dapplets.openPopup()')
  await page.locator('dapplets-overlay-manager #app [data-testid="system-tab-dapplets"]').click()

  // turn on the dev server
  await page.locator('dapplets-overlay-manager #app [data-testid="system-tab-settings"]').click()
  await page
    .locator('dapplets-overlay-manager #app [data-testid="settings-page-developer"]')
    .click()
  await page
    .locator('dapplets-overlay-manager #app [data-testid="dev-server"]')
    .filter({ hasText: devServerUrl })
    .locator('button', { hasText: 'Disabled' })
    .click()

  // cy.wait(3000)
  await page.locator('dapplets-overlay-manager #app [data-testid="system-tab-dapplets"]').click()

  // widget does not exist
  await expect(page.locator('.dapplet-widget')).not.toBeVisible()

  // activate CA dapplet
  await page
    .locator(
      `dapplets-overlay-manager #app [data-testid="${dappletIdToActivate}"] [data-testid="activation-dapplet"]`
    )
    .click()

  // widget exists
  await expect(page.locator('.dapplet-widget')).toBeVisible({ timeout: 50000 })
  // })
  // )
})
