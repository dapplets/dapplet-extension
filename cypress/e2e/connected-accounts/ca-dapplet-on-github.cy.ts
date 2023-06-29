import { qase } from 'cypress-qase-reporter/dist/mocha'

const urlToOpen = 'https://github.com/Ni-2'
const urlToCheck = 'https://twitter.com/teremovskii'
const dappletIdToActivate = 'connecting-accounts-dapplet'
// todo: unwork
describe('CA: dapplet on GitHub', () => {
  qase(
    3,
    it('CA: dapplet on GitHub', () => {
      // open overlay
      cy.openDappletsOverlay(urlToOpen)

      // find Connecting Accounts dapplet
      cy.get('dapplets-overlay-manager').contains('Connected Accounts', {
        timeout: 30000,
        includeShadowDom: true,
      })

      // avatar badge is not exist
      cy.get('.dapplet-widget').should('not.exist')

      // activate CA dapplet
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // find avatar badge
      cy.get('.dapplet-widget')

      // popup is not visible
      cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('not.be.visible')

      // open popup and find more than 1 connected accounts
      cy.get('.dapplet-widget').find('.profile-badge').click()
      cy.get('.dapplets-connected-accounts-wrapper')
        .find('.accounts')
        .should('be.visible')
        .find('.account-container')
        .should('have.length.greaterThan', 1)

      // find nikter.near among accounts
      cy.get('.dapplets-connected-accounts-wrapper').contains('nikter.near')

      //  check the link to accounts page
      cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('be.visible')
      cy.get('.dapplets-connected-accounts-wrapper')
        .find('.account')
        .contains('teremovskii')
        .should('have.attr', 'href', urlToCheck)
        .should('have.attr', 'target', '_blank')

      // popup closes after click
      cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('be.visible')
      cy.get('body').click({ force: true })
      cy.get('.dapplets-connected-accounts-wrapper').find('.accounts').should('not.be.visible')
    })
  )
})
