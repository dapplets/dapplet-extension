import { qase } from 'cypress-qase-reporter/dist/mocha'

const urlToOpen = 'https://example.com'
const dappletIdToActivate = 'test-common-dapplet.dapplet-base.eth'
const dappletNameToActivate = 'Test Common Adapter'
const devServerUrl = 'http://localhost:3000/dapplet.json'

describe('Test Common dapplet', () => {
  qase(
    144,
    it('Test Common dapplet', () => {
      // open overlay
      cy.openDappletsOverlay(urlToOpen)

      // turn on the dev server
      cy.getByTestId('system-tab-settings').click()
      cy.getByTestId('settings-page-developer').click()
      cy.getByTestId('dev-server')
        .contains(devServerUrl)
        .parent()
        .parent()
        .find('button')
        .contains('Disabled')
        .click()
      cy.wait(3000)
      cy.getByTestId('system-tab-dapplets').click()

      // find the dapplet
      cy.get('dapplets-overlay-manager').contains(dappletNameToActivate, {
        timeout: 30000,
        includeShadowDom: true,
      })

      // widget does not exist
      cy.get('.dapplet-widget').should('not.exist')

      // activate CA dapplet
      cy.runDapplet(dappletIdToActivate)

      // widget exists
      cy.get('.dapplet-widget')
    })
  )
})
