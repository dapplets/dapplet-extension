import { expect, test } from '../fixtures/browser'
import { Overlay } from '../pages/overlay'

test('should show empty dapplets list', async ({ page }) => {
  const overlay = new Overlay(page)

  await page.goto('https://example.com/')
  await overlay.goto()
  await overlay.clickToggle()
  await expect(overlay.root).toContainText('No available dapplets for current site')
})
