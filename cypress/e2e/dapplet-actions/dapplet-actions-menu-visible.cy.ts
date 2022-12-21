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
      // 'open developer page'
      cy.getByTestId('system-tab-settings', { includeShadowDom: true }).click().wait(5000)

      cy.getByTestId('settings-page-developer', { includeShadowDom: true }).click()
      // add localhost test dapplet
      cy.wait(5000)
      cy.getByTestId('input-add-localhost', { includeShadowDom: true }).type(
        'http://localhost:3003/dapplet.json'
      )

      cy.getByTestId('button-add-localhost', { includeShadowDom: true }).then((button) => {
        if (button.prop('disabled')) {
          cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()
        } else {
          cy.getByTestId('button-add-localhost', { includeShadowDom: true }).click().wait(5000)

          cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()
        }
      })
      // change activate dapplet
      cy.wait(5000)
        .getByTestId('activation-dapplet', { includeShadowDom: true })
        .first()
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy.getByTestId('activation-dapplet', { includeShadowDom: true }).click()
        })

      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
      // minimize overlay
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      //  change main menu dapplet
      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()
      cy.getByTestId('dapplet-active-menu', { includeShadowDom: true }).should('exist')
    })
  )
})
