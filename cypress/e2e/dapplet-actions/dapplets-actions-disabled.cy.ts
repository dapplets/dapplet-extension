import { qase } from 'cypress-qase-reporter/dist/mocha'
describe('disabled dapplet action', () => {
  qase(
    2,
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
      cy.get('dapplets-overlay-manager')
        .getByTestId('show-tabs-button', { includeShadowDom: true })
        .click()
      // })

      // it('opens empty dapplets list', () => {
      cy.get('dapplets-overlay-manager')
        .getByTestId('toggle-overlay-button', { includeShadowDom: true })
        .click()

      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
      // 'open developer page'
      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .getByTestId('system-tab-Settings', { includeShadowDom: true })
        .click()
        .wait(5000)

      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .getByTestId('settings-page-Developer', { includeShadowDom: true })
        .click()
      // add localhost test dapplet
      cy.get('dapplets-overlay-manager', { includeShadowDom: true }).wait(5000)
      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .getByTestId('input-add-localhost', { includeShadowDom: true })
        .type('http://localhost:3003/dapplet.json')

      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .getByTestId('button-add-localhost', { includeShadowDom: true })
        .then((button) => {
          if (button.prop('disabled')) {
            cy.get('dapplets-overlay-manager')
              .getByTestId('toggle-overlay-button', { includeShadowDom: true })
              .click()
          } else {
            cy.get('dapplets-overlay-manager', { includeShadowDom: true })
              .getByTestId('button-add-localhost', { includeShadowDom: true })
              .click()
              .wait(5000)

            cy.get('dapplets-overlay-manager')
              .getByTestId('toggle-overlay-button', { includeShadowDom: true })
              .click()
              .wait(10000)
          }
        })
      // change activate dapplet
      cy.get('dapplets-overlay-manager')
        .wait(5000)
        .getByTestId('activation-dapplet', { includeShadowDom: true })
        .first()
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy
              .get('dapplets-overlay-manager')
              .getByTestId('activation-dapplet', { includeShadowDom: true })
              .click()
        })

      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
      // minimize overlay
      cy.get('dapplets-overlay-manager')
        .getByTestId('toggle-overlay-button', { includeShadowDom: true })
        .click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      //  change disabled dapplet action
      cy.get('dapplets-overlay-manager')
        .getByTestId('tab-not-pinned', { includeShadowDom: true })
        .click()
      cy.get('dapplets-overlay-manager')
        .getByTestId('button-not-pinned', { includeShadowDom: true })
        .last()
        .should('have.attr', 'disabled')
    })
  )
})
