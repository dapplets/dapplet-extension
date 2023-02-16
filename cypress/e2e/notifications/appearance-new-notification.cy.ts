import { qase } from 'cypress-qase-reporter/dist/mocha'
const url ='https://example.com'
const dappletIdToActivate ="test-notify"
describe('appearance of a new notification', () => {
    qase(
      15,
      it('appearance of a new notification', () => {
        cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)
      cy.getByTestId('notification-label').should('exist')
      })
    )
  })