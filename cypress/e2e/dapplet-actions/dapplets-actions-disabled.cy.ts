import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'

describe('disabled dapplet action', () => {
  qase(
    10,
    it('disabled dapplet action', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url)
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('toggle-overlay-button', { includeShadowDom: true }).click()

      cy.get('dapplets-overlay-manager').should('have.class', 'dapplets-overlay-collapsed')

      // change disabled dapplet action
      cy.getByTestId('tab-not-pinned', { includeShadowDom: true }).click()
      cy.getByTestId('button-not-pinned', { includeShadowDom: true })
        .last()
        .should('have.attr', 'disabled')
    })
  )
})
