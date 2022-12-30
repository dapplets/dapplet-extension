import { qase } from 'cypress-qase-reporter/dist/mocha'
describe('dapplets action test', () => {
  qase(
    2,
    it('dapplets action test', () => {
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
        .find('[data-testid=action-test]', { includeShadowDom: true })
        .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy
              .get('dapplets-overlay-manager', { includeShadowDom: true })
              .find('[data-testid=action-test]', { includeShadowDom: true })
              .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
              .click()
        })
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      //  change main menu dapplet
      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()
      cy.getByTestId('dapplet-active-menu', { includeShadowDom: true }).should('exist')
    })
  )
})
