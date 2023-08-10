import { expect, test } from '../../fixtures/browser'
import { WalletTypes } from '../../pages/connect-wallet-popup'
import { Overlay } from '../../pages/overlay'

// ToDo: qase 15

test('should show new norification', async ({ page }) => {
  const overlay = new Overlay(page)

  await page.goto('/')
  await overlay.goto()
  await overlay.skipTutorial()
  await overlay.clickToggle()
  await overlay.clickProfile()
  await loginModal.clickAddWallet()
  await connectWalletPopup.connectWallet(WalletTypes.BuiltIn)

  cy.runDapplet('event-bus.tests')
  cy.getByTestId('notification-page').click()
  cy.getByTestId('notification-label').contains('Your Twitter has been hacked')
  cy.getByTestId('notification-label').contains('Ignore').should('exist')

  // Unlink click is handled by @OnAction decorator
  cy.getByTestId('notification-label').contains('Unlink').click()
  cy.getByTestId('notification-label').contains('UnlinkClicked').should('exist')

  await expect(overlay.profile).toContainText('0x87e1...beC1')
})
