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

      // expands to ubersausage mode
      cy.getByTestId('show-tabs-button').click()
      cy.wait(10000)

      // minimize overlay
      cy.getByTestId('minimize-overlay-button').click()

      cy.getByTestId('tab-not-pinned').click()

      // check dapplet action title
      cy.getByTestId('button-not-pinned')
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new title')

      cy.getByTestId('button-not-pinned').first().click()

      // check dapplet action new title
      cy.getByTestId('button-not-pinned')
        .first()
        .invoke('prop', 'title')
        .should('equal', 'new click')
    })
  )
})
