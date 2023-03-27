const trustedUser = '0xF64849376812667BDa7D902666229f8b8dd90687'

Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid="${selector}"]`, ...args)
})

Cypress.Commands.add('openDappletsOverlay', (url, params?: Partial<{ wipe: boolean }>) => {
  // open context webpage
  cy.visit(url)

  // injects overlay
  cy.get('dapplets-overlay-manager')

  if (params?.wipe) {
    cy.window().then((win) => win.dapplets.wipeAllExtensionData())
  }

  // add test trusted user
  cy.window().then((win) => win.dapplets.addTrustedUser(trustedUser))

  // show minimized overlay
  cy.window().then((win) => win.dapplets.openPopup())
  cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-hidden')

  // expands to ubersausage mode
  // cy.getByTestId('show-tabs-button').click()

  // opens dapplets list
  // cy.getByTestId('toggle-overlay-button').click()
  cy.getByTestId('system-tab-dapplets').click()

  // cy.getByTestId('system-tab-settings').click()
  // cy.getByTestId('toggle-overlay-button').click()

  cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
})

Cypress.Commands.add('runDapplet', (dappletIdToActivate) =>
  cy
    .get('dapplets-overlay-manager')
    .find(`[data-testid=${dappletIdToActivate}]`)
    .find('[data-testid=activation-dapplet]')
    .then((button) => {
      button.hasClass('not-active-switch') &&
        cy
          .get('dapplets-overlay-manager')
          .find(`[data-testid=${dappletIdToActivate}]`)
          .find('[data-testid=activation-dapplet]')
          .click()
    })
)
