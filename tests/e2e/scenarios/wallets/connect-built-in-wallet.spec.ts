import { expect, test } from '../../fixtures/browser'
import { ConnectWalletPopup, WalletTypes } from '../../pages/connect-wallet-popup'
import { LoginModal } from '../../pages/login-modal'
import { Overlay } from '../../pages/overlay'

// ToDo: qase 14

test('should connect built-in Ethereum wallet', async ({ page }) => {
  const overlay = new Overlay(page)
  const loginModal = new LoginModal(page)
  const connectWalletPopup = new ConnectWalletPopup(page)

  await page.goto('/')
  await overlay.goto()
  await overlay.skipTutorial()
  await overlay.clickToggle()
  await overlay.clickProfile()
  await loginModal.clickAddWallet()
  await connectWalletPopup.connectWallet(WalletTypes.BuiltIn)

  await expect(overlay.profile).toContainText('0x87e1...beC1')
})
