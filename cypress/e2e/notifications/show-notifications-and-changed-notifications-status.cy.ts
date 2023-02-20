import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'test-notify'

let counter
let newCounter

describe('show notification in notification`s page', () => {
  qase(
    16,
    it('show notification in notification`s page', () => {
      cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)
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
