import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'test-notify'
const dappletIdToActivate2 = 'event-bus.tests'
let counter
let newCounter
// todo: unwork
describe('show notification in notification`s page', () => {
  qase(
    16,
    it('show notification in notification`s page', () => {
      cy.openDappletsOverlay(url, { wipe: true })
      // cy.getByTestId('skip-tutorial').click()
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)
      cy.runDapplet(dappletIdToActivate2)
      cy.wait(15000)
      cy.getByTestId('notification-page').click()
      cy.getByTestId('notification').should('exist')
      cy.getByTestId('notification-counter').then(
        (count) => (counter = +count[0].innerText.substring(1))
      )
      cy.getByTestId('notification-dismiss').first().click()
      cy.wait(2000)
      cy.getByTestId('notification-counter').then((count) => {
        newCounter = +count[0].innerText.substring(1)
      })

      cy.then(() => counter > newCounter).should('be.true')
    })
  )
})
