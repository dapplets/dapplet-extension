import { qase } from 'cypress-qase-reporter/dist/mocha'
describe('disabled dapplet action', () => {
  qase(
    10,
    it('disabled dapplet action', () => {
      // it('opens context webpage', () => {
      cy.visit('https://example.com')
      // })

      // it('injects overlay', () => {
      cy.get('dapplets-overlay-manager')
      // })

      // it('shows minimized overlay', () => {
      cy.window().then((win) => win.dapplets.openPopup())
      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-hidden')
      // })

      // it('expands to ubersausage mode', () => {
      cy.getByTestId('show-tabs-button', { includeShadowDom: true }).click()
      // })

      // it('opens empty dapplets list', () => {
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')

      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .find('[data-testid=test-action]', { includeShadowDom: true })
        .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy
              .get('dapplets-overlay-manager', { includeShadowDom: true })
              .find('[data-testid=test-action]', { includeShadowDom: true })
              .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
              .click()
        })
      cy.wait(5000)

      // minimize overlay
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      //  change disabled dapplet action
      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .last()
        .should('have.attr', 'disabled')
    })
  )
})
