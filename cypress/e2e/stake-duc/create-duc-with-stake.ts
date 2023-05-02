import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'

describe('Create DUC with stake', () => {
  qase(
    33,
    it('Create DUC with stake', () => {
      // open overlay and run the dapplet
      cy.visit('https://example.com')

      cy.get('dapplets-overlay-manager').getByTestId('profile-widget').click()

      cy.get('dapplets-overlay-manager')
        .find('[data-testid=profile-widget]')
        .getByTestId('add-wallet-btn-profile-widget')
        .click()

      cy.get('dapplets-overlay-manager').getByTestId('wallet-to-connect-dapplets_goerli').click()

    
    })
  )
})
