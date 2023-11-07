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
  'dapplet-actions',
  // 'test-dynamic-dapplet', // ToDo: uncomment when dynamic context will be fixed
  // 'update-parsed-context', // ToDo: uncomment when testing website will be implemented
]

for (const dappletName of dapplets) {
  const test = base({ devServerUrl, dappletName })

  test(dappletName, async ({ page, testableDapplet }) => {
    const overlay = new Overlay(page)

    switch (dappletName) {
      case 'core-alert':
      case 'core-confirm-ok':
        // ToDo: don't use locator here, move them into Page Object Models
        //       when testing website will be implemented
        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        await page.getByRole('button', { name: 'Ok' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break

      case 'core-notify-subscribe-decorator': // ToDo: qase 15
      case 'core-notify-subscribe-manually': // ToDo: qase 31
        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        const floatingNotification = await page.getByTestId('notification-label')
        await expect(floatingNotification).toContainText('Test Title')
        await expect(floatingNotification).toContainText('Test Message')
        await floatingNotification.getByText('show more').click() // opens notifications overlay
        await expect(floatingNotification).not.toBeVisible()
        await page.getByRole('button', { name: 'Ok' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        await expect(page.getByTestId('notification-counter')).toHaveText('+1')
        await page.getByText('Mark all as read').click()
        await expect(page.getByTestId('notification-counter')).not.toBeVisible()
        await expect(page.getByTestId('new-notification')).not.toBeVisible()
        await expect(page.getByText('Mark all as read')).toBeDisabled()
        await expect(page.getByTestId('old-notification')).toHaveCount(2)
        await page.waitForTimeout(1000)
        await expect(page.getByRole('button', { name: 'Ok' })).not.toBeVisible() // Action buttons must be hidden, if notification is resolved
        break

      case 'core-confirm-cancel':
        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break

      case 'server-interaction':
        await page.waitForTimeout(2000) // wait websocket message
        const before = await page
          .locator('.dapplet-widget')
          .locator(':scope > *')
          .first()
          .textContent()

        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        const incrementedValue = (Number(before) + 1).toString()
        expect(page.locator('.dapplet-widget', { hasText: incrementedValue })).toBeVisible()
        break

      case 'dapplet-actions':
        await overlay.goto()
        await page.getByTestId('tab-not-pinned').click()
        await page.getByRole('button', { name: 'HIDE 1' }).click()
        await expect(page.getByText('HIDE 1')).not.toBeVisible()
        await page.getByTestId('tab-not-pinned').click()
        await page.getByRole('button', { name: 'HIDE 2' }).click()
        await expect(page.getByText('HIDE 2')).not.toBeVisible()
        break

      default:
        await page.locator('.dapplet-widget').locator(':scope > *').first().click()
        await expect(page.getByText('PASS').first()).toBeVisible()
        break
    }
  })
}
