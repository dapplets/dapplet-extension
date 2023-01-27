import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'

describe('disabled dapplet action', () => {
  qase(
    10,
    it('disabled dapplet action', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)

      // expands to ubersausage mode
      cy.getByTestId('show-tabs-button').click()
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('minimize-overlay-button').click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      // change disabled dapplet action
      cy.getByTestId('tab-not-pinned').click()
      cy.getByTestId('button-not-pinned').last().should('have.attr', 'disabled')
    })
  )
})
