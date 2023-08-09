import { expect, test } from './fixtures'

// import { createFixture } from 'playwright-webextext'
// const { test, expect } = createFixture(path.join(__dirname, '../build'))

test('example test', async ({ page }) => {
  await page.goto('https://example.com')
  await page.waitForFunction(() => !!window['dapplets'])
  await page.evaluate('window.dapplets.openPopup()')
  await page.locator('dapplets-overlay-manager #app [data-testid="system-tab-dapplets"]').click()
  await expect(page.locator('dapplets-overlay-manager #app')).toContainText(
    'No available dapplets for current site'
  )
})
