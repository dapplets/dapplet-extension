import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('actions-in-floating-notification', () => {
  qase(
    31,
    it('appearance of a new notification', () => {
      cy.openDappletsOverlay('https://example.com', { wipe: true })
      cy.runDapplet('event-bus.tests')
      cy.getByTestId('notification-label').should('exist')
      cy.getByTestId('notification-label').contains('Your Twitter has been hacked')
      cy.getByTestId('notification-label').contains('Unlink').should('exist')

      // Ignore click is handled by Core.events.ofType subscription
      cy.getByTestId('notification-label').contains('Ignore').should('exist').click()
      cy.getByTestId('notification-label').contains('IgnoreClicked').should('exist')
    })
  )
})
