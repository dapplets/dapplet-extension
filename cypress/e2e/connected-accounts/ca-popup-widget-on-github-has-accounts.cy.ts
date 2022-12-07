describe('CA: popup widget on GitHub has accounts', () => {
  it('opens Ni-2 profile GitHub page', () => {
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

  it('opens dapplets list', () => {
    cy.get('dapplets-overlay-manager')
      .getByTestId('toggle-overlay-button', { includeShadowDom: true })
      .click()
    cy.get('dapplets-overlay-manager').should('not.have.class', 'dapplets-overlay-collapsed')
  })

  it('find Connecting Accounts dapplet', () => {
    cy.get('dapplets-overlay-manager').contains('Connecting Accounts', {
      timeout: 20000,
      includeShadowDom: true,
    })
  })

  it('avatar badge is not exist', () => {
    cy.get('.dapplet-widget').should('not.exist')
  })

  it('activate CA dapplet', () => {
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
            .wait(25000)
      })
    cy.get('dapplets-overlay-manager', { includeShadowDom: true })
      .find('[data-testid=connecting-accounts-dapplet]', { includeShadowDom: true })
      .find('[data-testid=activation-dapplet]', { includeShadowDom: true })
      .should('have.class', 'active-switch')
  })

  it('find avatar badge', () => {
    cy.get('.dapplet-widget')
  })

  it('popup is not visible', () => {
    cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
      .find('.accounts', { includeShadowDom: true })
      .should('not.be.visible')
  })

  it('open popup and find more than 1 connected accounts', () => {
    cy.get('.dapplet-widget').find('.profile-badge', { includeShadowDom: true }).click()
    cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
      .find('.accounts', { includeShadowDom: true })
      .should('be.visible')
      .find('.account-container', { includeShadowDom: true })
      .should('have.length.greaterThan', 1)
  })

  it('find nik3ter.testnet among accounts', () => {
    cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true }).contains(
      'nik3ter.testnet',
      { includeShadowDom: true }
    )
  })

  it('popup closes after click', () => {
    cy.get('main').click()
    cy.wait(1000)
    cy.get('.dapplets-connected-accounts-wrapper', { includeShadowDom: true })
      .find('.accounts', { includeShadowDom: true })
      .should('not.be.visible')
  })
})
