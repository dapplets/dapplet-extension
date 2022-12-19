import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('dapplets action work', () => {
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

      // })

      // it('activate test dapplet', ()=>{
      cy.getByTestId('system-tab-settings', { includeShadowDom: true }).click().wait(5000)

      cy.getByTestId('settings-page-developer', { includeShadowDom: true }).click()

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

      cy.wait(5000)

      cy.getByTestId('activation-dapplet', { includeShadowDom: true })
        .first()
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy.getByTestId('activation-dapplet', { includeShadowDom: true }).click()
        })

      // })

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
