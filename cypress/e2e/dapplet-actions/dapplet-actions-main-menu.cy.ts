import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('dapplets action main menu', () => {
  qase(
    12,
    it('dapplets action test', () => {
      // open context webpage
      cy.visit('https://example.com')

      // inject overlay
      cy.get('dapplets-overlay-manager')

      // show minimized overlay
      cy.window().then((win) => win.dapplets.openPopup())
      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-hidden')

      // check main menu actions
      // cy.getByTestId('tab-pinned').first().click()

      // cy.getByTestId('main-menu-actions').should('exist')
    })
  )
})
