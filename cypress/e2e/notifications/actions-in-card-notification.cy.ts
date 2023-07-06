import { qase } from 'cypress-qase-reporter/dist/mocha'
// todo: unwork
describe('actions-in-card-notification', () => {
  qase(
    15, // TODO
    it('appearance of a new notification', () => {
      cy.openDappletsOverlay('https://example.com', { wipe: true })
      cy.runDapplet('event-bus.tests')
      cy.getByTestId('notification-page').click()
      cy.getByTestId('notification-label').contains('Your Twitter has been hacked')
      cy.getByTestId('notification-label').contains('Ignore').should('exist')

      // Unlink click is handled by @OnAction decorator
      cy.getByTestId('notification-label').contains('Unlink').click()
      cy.getByTestId('notification-label').contains('UnlinkClicked').should('exist')
    })
  )
})
