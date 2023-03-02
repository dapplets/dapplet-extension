import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://github.com/Ni-2'
const dappletIdToActivate = 'connecting-accounts-dapplet'

describe('CA: Switch contract networks', () => {
  qase(
    18,
    it('CA: Switch contract networks', () => {
      // open overlay
      cy.openDappletsOverlay(url)

      // find Connecting Accounts dapplet
      cy.get('dapplets-overlay-manager').contains('Connected Accounts', {
        timeout: 30000,
        includeShadowDom: true,
      })

      // avatar badge is not exist
      cy.get('.dapplet-widget').should('not.exist')

      // activate CA dapplet
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // switch networks

      cy.getByTestId('system-tab-settings').click()
      cy.getByTestId('preferred-connected-accounts-network').contains('mainnet').click()
      cy.wait(1000)
      cy.getByTestId('preferred-connected-accounts-network')
        .find('[data-testid="opened-dropdown"]')
        .find('[data-testid="testnet"]')
        .click({ force: true })

      // find avatar badge
      cy.get('.dapplet-widget')

      // popup is not visible
      cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('not.be.visible')

      // open popup and find more than 1 connected accounts
      cy.get('.dapplet-widget').find('.profile-badge').click()
      cy.get('.dapplets-connected-accounts-wrapper')
        .find('.accounts')
        .should('be.visible')
        .find('.account-container')
        .should('have.length.greaterThan', 1)

      // find nik3ter.testnet among accounts
      cy.get('.dapplets-connected-accounts-wrapper').contains('nik3ter.testnet')
    })
  )
})
