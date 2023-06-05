import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'
// todo: unwork
describe('disabled dapplet action', () => {
  qase(
    10,
    it('disabled dapplet action', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url, { wipe: true })
      cy.runDapplet(dappletIdToActivate)
      cy.wait(5000)
      // expands to ubersausage mode
      cy.getByTestId('skip-tutorial').click()
      cy.getByTestId('notification-button').click()
      cy.wait(1000)
      cy.getByTestId('system-tab-dapplets').click()
      cy.wait(1000)
      cy.getByTestId('show-tabs-button').click()
      cy.getByTestId('minimize-overlay-button').click()

      // change disabled dapplet action
      cy.getByTestId('tab-not-pinned').click()
      cy.getByTestId('button-not-pinned').last().should('have.attr', 'disabled')
    })
  )
})
