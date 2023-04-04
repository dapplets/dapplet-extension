import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'

describe('connect Ethereum build-in wallet', () => {
  qase(
    14,
    it('connect Ethereum build-in wallet', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url, { wipe: true })

      cy.get('dapplets-overlay-manager').getByTestId('profile-widget').click()

      cy.get('dapplets-overlay-manager')
        .find('[data-testid=profile-widget]')
        .getByTestId('add-wallet-btn-profile-widget')
        .click()

      cy.get('dapplets-overlay-manager').getByTestId('wallet-to-connect-dapplets_goerli').click()

      cy.get('dapplets-overlay-manager')
        .find('[data-testid=profile-widget]')
        .contains('0x87e1...beC1')
    })
  )
})
