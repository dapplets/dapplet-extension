import { expect, test } from '../fixtures/browser'
import { Overlay } from '../pages/overlay'

test('should show empty dapplets list', async ({ page }) => {
  const overlay = new Overlay(page)

  await page.goto('/')
  await overlay.goto()
  await expect(overlay.root).toContainText('No available dapplets for current site')
})
