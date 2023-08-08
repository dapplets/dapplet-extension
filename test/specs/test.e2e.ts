import { $, browser, expect } from '@wdio/globals'

describe('Example', () => {
  it('should show empty dapplets list ', async () => {
    await browser.url(`https://example.com`)

    await browser.execute('window.dapplets.openPopup()')

    const overlay = await $('dapplets-overlay-manager')
    await overlay.shadow$('[data-testid="system-tab-dapplets"]').click()

    await expect(overlay.shadow$('#app')).toHaveTextContaining(
      'No available dapplets for current site'
    )
  })
})
