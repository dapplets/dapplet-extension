import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('dapplets action work', () => {
  qase(
    11,
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

      // })

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

      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()

      // it('check dapplet action title', ()=>{
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new title')

      cy.getByTestId('button-not-pinned', { includeShadowDom: true }).first().click()
      // })
      // it('check dapplet action new title', ()=>{
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new click')
      // })
    })
  )
})
