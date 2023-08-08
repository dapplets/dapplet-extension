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
      cy.wait(10000)

      // widget exists
      cy.get('.dapplet-widget', {
        timeout: 50000,
        includeShadowDom: true,
      })

      // // popup is not visible
      // cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('not.be.visible')

      // // open popup and find more than 1 connected accounts
      // cy.get('.dapplet-widget').find('.profile-badge').click({ force: true })
      // cy.get('.dapplets-connected-accounts-wrapper')
      //   .find('.accounts')
      //   .should('be.visible')
      //   .find('.account-container')
      //   .should('have.length.greaterThan', 1)

      // // find nikter.near among accounts
      // cy.get('.dapplets-connected-accounts-wrapper').contains('nikter.near')

      // //  check the link to accounts page
      // cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('be.visible')
      // cy.get('.dapplets-connected-accounts-wrapper').find('.account').contains('Ni-2')
      // // .should('have.attr', 'href', urlToCheck)
      // // .should('have.attr', 'target', '_blank')

      // // popup closes after click
      // cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('be.visible')
      // cy.get('body').click({ force: true })
      // cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('not.be.visible')
    })
  )
})
