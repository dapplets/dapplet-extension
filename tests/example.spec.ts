import { expect, test } from './fixtures'

test('example test', async ({ page }) => {
  await page.goto('https://example.com')
  await page.evaluate('window.dapplets.openPopup()')
  await page.locator('dapplets-overlay-manager #app [data-testid="system-tab-dapplets"]').click()
  await expect(page.locator('dapplets-overlay-manager #app')).toContainText(
    'No available dapplets for current site'
  )
})
