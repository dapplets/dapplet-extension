import { expect, test as base } from '../fixtures/pass-fail-dapplet'
import { Overlay } from '../pages/overlay'

const devServerUrl = 'http://localhost:3000/dapplet.json'

const dapplets = [
  'core-alert',
  'core-confirm-cancel',
  'core-confirm-ok',
  'core-notify-subscribe-decorator',
  'core-notify-subscribe-manually',
  'core-notify-without-actions',
  'inject-via-activate',
  'inject-via-constructor',
  'inject-via-props',
  'server-interaction',
  'test-common-dapplet',
  // 'test-dynamic-dapplet', // ToDo: uncomment when dynamic context will be fixed
  // 'update-parsed-context', // ToDo: uncomment when testing website will be implemented
]

for (const dappletName of dapplets) {
  const test = base({ devServerUrl, dappletName })

  test(`should inject widget in ${dappletName}`, async ({ page, testableDapplet }) => {
    switch (dappletName) {
      case 'core-alert':
      case 'core-confirm-ok':
        await page.getByRole('button', { name: 'Ok' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break

      case 'core-notify-subscribe-decorator':
      case 'core-notify-subscribe-manually':
        const overlay = new Overlay(page)
        await overlay.clickNotifications()
        await page.getByRole('button', { name: 'Ok' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break

      case 'core-confirm-cancel':
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break

      case 'server-interaction':
        const before = Number(await page.locator('.dapplet-widget').textContent())
        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        const incrementedValue = (before + 1).toString()
        expect(page.locator('.dapplet-widget', { hasText: incrementedValue })).toBeVisible()
        break

      default:
        await expect(page.getByText('PASS').first()).toBeVisible()
        break
    }
  })
}
