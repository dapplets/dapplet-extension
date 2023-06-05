import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'
const dappletIdToActivate = 'action-test'

describe('dapplets action work', () => {
  qase(
    11,
    it('dapplets action test', () => {
      // open overlay and run the dapplet
      cy.openDappletsOverlay(url, { wipe: true })
      cy.runDapplet(dappletIdToActivate)
      cy.wait(5000)
      // expands to ubersausage mode
      cy.getByTestId('skip-tutorial').click()
      cy.getByTestId('notification-button').click()
      cy.wait(1000)
      cy.getByTestId('system-tab-dapplets').click()
      cy.wait(1000)
      cy.getByTestId('show-tabs-button').click()
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
