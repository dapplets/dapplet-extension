import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'

describe('dapplets action test', () => {
  qase(
    2,
    it('dapplets action test', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('toggle-overlay-button').click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      // change main menu dapplet
      cy.getByTestId('tab-not-pinned').click()
      cy.getByTestId('dapplet-active-menu').should('exist')
    })
  )
})
