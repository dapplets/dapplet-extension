import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'test-notify'

describe('appearance of a new notification', () => {
  qase(
    17,
    it('appearance of a new notification', () => {
      cy.openDappletsOverlay(url, { wipe: true })
      cy.runDapplet(dappletIdToActivate)
      cy.getByTestId('notification-page').click()
      cy.getByTestId('notification').should('exist')
      cy.getByTestId('notification-dismiss').first().click()
      cy.wait(1000)
      cy.getByTestId('notification-show-old').click()
      cy.getByTestId('old-notification').should('exist')
    })
  )
})
