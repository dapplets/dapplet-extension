describe('CA: popup widget on GitHub has accounts', () => {
  it('opens context webpage', () => {
    cy.visit('https://github.com/Ni-2')
  })

  it('injects overlay', () => {
    cy.get('dapplets-overlay-manager')
  })

  it('shows minimized overlay', () => {
    cy.window().then((win) => win.dapplets.openPopup())
    cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-hidden')
  })

  it('expands to ubersausage mode', () => {
    cy.get('dapplets-overlay-manager')
      .getByTestId('show-tabs-button', { includeShadowDom: true })
      .click()
  })

  it('opens empty dapplets list', () => {
    cy.get('dapplets-overlay-manager')
      .getByTestId('toggle-overlay-button', { includeShadowDom: true })
      .click()

    cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')

    cy.get('dapplets-overlay-manager').contains('Connecting Accounts', {
      timeout: 20000,
      includeShadowDom: true,
    })
  })
})
