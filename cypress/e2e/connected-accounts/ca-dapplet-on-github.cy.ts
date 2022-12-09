import { qase } from 'cypress-qase-reporter/dist/mocha'

describe('CA: dapplet on GitHub', () => {
  qase(
    3,
    it('there is CA dapplet in the dapplets list on GitHub', () => {
      // it('opens Ni-2 profile GitHub page', () => {
      cy.visit('https://github.com/Ni-2')
      // })

      // it('injects overlay', () => {
      cy.get('dapplets-overlay-manager')
      // })

      // it('shows minimized overlay', () => {
      cy.window().then((win) => win.dapplets.openPopup())
      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-hidden')
      // })

      // it('expands to ubersausage mode', () => {
      cy.get('dapplets-overlay-manager')
        .getByTestId('show-tabs-button', { includeShadowDom: true })
        .click()
      // })

      // it('opens dapplets list', () => {
      cy.get('dapplets-overlay-manager')
        .getByTestId('toggle-overlay-button', { includeShadowDom: true })
        .click()
      cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
      // })

      // it('find Connecting Accounts dapplet', () => {
      cy.get('dapplets-overlay-manager').contains('Connecting Accounts', {
        timeout: 20000,
        includeShadowDom: true,
      })
      // })
    })
  )

  qase(
    8,
    it('they can activate CA dapplet', () => {
      // it('avatar badge is not exist', () => {
      cy.get('.dapplet-widget').should('not.exist')
      // })

      // it('activate CA dapplet', () => {
      cy.get('dapplets-overlay-manager', { includeShadowDom: true })
        .find('[data-testid=connecting-accounts-dapplet]', { includeShadowDom: true })
        .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
        .should('have.class', 'not-active-switch')
        .then((button) => {
          button.hasClass('not-active-switch') &&
            cy
              .get('dapplets-overlay-manager', { includeShadowDom: true })
              .find('[data-testid=connecting-accounts-dapplet]', { includeShadowDom: true })
              .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
              .click()
        })
      // })

      // it('find avatar badge', () => {
      cy.get('.dapplet-widget')
      // })

      // it('the dapplets switch in the list is active', () => {
      // cy.get('dapplets-overlay-manager', { includeShadowDom: true })
      //   .find('[data-testid=connecting-accounts-dapplet]', { includeShadowDom: true })
      //   .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
      //   .should('have.class', 'active-switch')
      // })
    })
  )

  qase(
    9,
    it('popup widget has accounts', () => {
      // it('popup is not visible', () => {
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('not.be.visible')
      // })

      // it('open popup and find more than 1 connected accounts', () => {
      cy.get('.dapplet-widget').find('.profile-badge', { includeShadowDom: true }).click()
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('be.visible')
        .find('.account-container', { includeShadowDom: true })
        .should('have.length.greaterThan', 1)
      // })

      // it('find nik3ter.testnet among accounts', () => {
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true }).contains(
        'nik3ter.testnet',
        { includeShadowDom: true }
      )
      // })
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

      cy.get('main').click()
      cy.wait(1000)
      cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
        .find('.accounts', { includeShadowDom: true })
        .should('not.be.visible')
    })
  )
})
