import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://github.com/Ni-2'
const dappletIdToActivate = 'connecting-accounts-dapplet'

describe('CA: dapplet on GitHub', () => {
  qase(
    3,
    it('there is CA dapplet in the dapplets list on GitHub', () => {
      // open overlay
      cy.openDappletsOverlay(url)

      // find Connecting Accounts dapplet
      cy.get('dapplets-overlay-manager').contains('Connecting Accounts', {
        timeout: 30000,
        includeShadowDom: true,
      })
    })
  )

  qase(
    8,
    it('they can activate CA dapplet', () => {
      // avatar badge is not exist
      cy.get('.dapplet-widget').should('not.exist')

      // activate CA dapplet
      cy.runDapplet(dappletIdToActivate)
      cy.wait(10000)

      // find avatar badge
      cy.get('.dapplet-widget')
    })
  )

  qase(
    9,
    it('popup widget has accounts', () => {
      // popup is not visible
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('not.be.visible')

      // open popup and find more than 1 connected accounts
      cy.get('.dapplet-widget').find('.profile-badge', { includeShadowDom: true }).click()
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('be.visible')
        .find('.account-container', { includeShadowDom: true })
        .should('have.length.greaterThan', 1)

      // find nik3ter.testnet among accounts
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true }).contains(
        'nik3ter.testnet',
        { includeShadowDom: true }
      )
    })
  )

  qase(
    6,
    it('copy account name', () => {
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.account-container', { includeShadowDom: true })
        .first()
        .find('.copy-button')
        .click()

      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.account-container', { includeShadowDom: true })
        .first()
        .invoke('text')
        .then((accountName) => {
          const name = accountName.trim()
          cy.window()
            // !!! In Chrome we should click Allow to dome question or the test will be failed !!!
            .its('navigator.clipboard')
            .invoke('readText')
            .should((copiedText) => {
              expect(copiedText).eq(name)
            })
        })
    })
  )

  qase(
    7,
    it('Link to accounts page', () => {
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('not.be.visible')
      cy.get('.dapplet-widget').find('.profile-badge', { includeShadowDom: true }).click()
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('be.visible')

      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.account', { includeShadowDom: true })
        .contains('teremovskii', { includeShadowDom: true })
        .should('have.attr', 'href', 'https://twitter.com/teremovskii')
        .should('have.attr', 'target', '_blank')
    })
  )

  qase(
    5,
    it('popup closes after click', () => {
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('be.visible')

      cy.get('body').click({ force: true })
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('not.be.visible')
    })
  )
})
