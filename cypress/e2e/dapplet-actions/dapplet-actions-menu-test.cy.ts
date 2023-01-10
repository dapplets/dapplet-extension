import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'

describe('dapplets action work', () => {
  qase(
    11,
    it('dapplets action test', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()

      // check dapplet action title
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new title')

      cy.getByTestId('button-not-pinned', { includeShadowDom: true }).first().click()

      // check dapplet action new title
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new click')
    })
  )
})
