import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('dapplets action main menu', () => {
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

      //   check main menu actions
      cy.getByTestId('tab-pinned', { includeShadowDom: true })
        .first()
        .click()

      cy.getByTestId('main-menu-actions', { includeShadowDom: true })
        .should('exist')
    })
  )
})
