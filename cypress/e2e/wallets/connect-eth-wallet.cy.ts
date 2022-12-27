import { qase } from 'cypress-qase-reporter/dist/mocha'

// const getIframeDocument = () => {
//   return (
//     cy
//       .get('iframe#overlay-iframe', { includeShadowDom: true })
//       // Cypress yields jQuery element, which has the real
//       // DOM element under property "0".
//       // From the real DOM iframe element we can get
//       // the "document" element, it is stored in "contentDocument" property
//       // Cypress "its" command can access deep properties using dot notation
//       // https://on.cypress.io/its
//       .its('0.contentDocument')
//       .should('exist')
//   )
// }

// const getIframeBody = () => {
//   // get the document
//   return (
//     getIframeDocument()
//       // automatically retries until body is loaded
//       .its('body')
//       .should('not.be.undefined')
//       // wraps "body" DOM element to allow
//       // chaining more Cypress commands, like ".find(...)"
//       .then(cy.wrap)
//   )
// }

describe('No available dapplets', () => {
  // qase(
  //   14,
  it('connect Ethereum build-in wallet', () => {
    // it('opens context webpage', () => {
    cy.visit('https://example.com')
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

    // it('should have test-action dapplet in the list', () => {
    cy.get('dapplets-overlay-manager').find('[data-testid=test-action]', {
      includeShadowDom: true,
    })
    // })

    cy.get('dapplets-overlay-manager')
      .getByTestId('profile-widget', { includeShadowDom: true })
      .click()

    cy.get('dapplets-overlay-manager')
      .find('[data-testid=profile-widget]', { includeShadowDom: true })
      .getByTestId('add-wallet-btn-profile-widget', { includeShadowDom: true })
      .click()

    cy.wait(4000)
    // })

    // it('gets the post', () => {
    // getIframeBody()
    //   .find('[data-testid=wallet-to-connect-dapplets_goerli]', { includeShadowDom: true })
    //   .click()
    // })

    // for <iframe id="foo" src="bar.html"></iframe>
    // cy.get('#overlay-iframe', { includeShadowDom: true })
    //   .iframe()
    //   .find('[data-testid=wallet-to-connect-dapplets_goerli]', { includeShadowDom: true })
    //   .click()

    // cy.get('#overlay-iframe', { includeShadowDom: true })
    //   .its('0.contentDocument.body') // 1
    //   .should('exist') // 2
    //   .then(cy.wrap) // 3
    //   .find('[data-testid=wallet-to-connect-dapplets_goerli]', { includeShadowDom: true })
    //   .click()

    // cy.get('dapplets-overlay-manager')
    //   .find('[data-testid=popup-item]', { includeShadowDom: true })
    //   .find('iframe#overlay-iframe', { includeShadowDom: true })
    // .find('[data-testid=connect-wallet-to-extension-popup]', {
    //   timeout: 20000,
    //   includeShadowDom: true,
    // })
    // .get('li', {
    //   timeout: 20000,
    //   includeShadowDom: true,
    // })
    // cy.enter('#overlay-iframe').then((getBody) => {
    //   getBody()
    //     .find('[data-testid=wallet-to-connect-dapplets_goerli]', { includeShadowDom: true })
    //     .click()
    // })

    // cy.frameLoaded('#overlay-iframe')
    cy.get('dapplets-overlay-manager').find('[data-testid=popup-item]', { includeShadowDom: true })
    // .iframe('#overlay-iframe')
    // .find('[data-testid=wallet-to-connect-dapplets_goerli]', { includeShadowDom: true })
    // .click()

    // cy.get('iframe', { includeShadowDom: true }).then(($iframe) => {
    //   const doc = $iframe.contents()
    //   cy.wrap(doc.find('[data-testid=profile-widget]')).click({ force: true })
    // })

    cy.wait(4000)

    cy.get('dapplets-overlay-manager')
      .find('[data-testid=profile-widget]', { includeShadowDom: true })
      .contains('0x87e1...beC1', { includeShadowDom: true })
  })
  // )
})
