// import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://example.com'

describe('No available dapplets', () => {
  // qase(
  //   14,
  it('connect Ethereum build-in wallet', () => {
    // open overlay and run the dapplet
    cy.openDappletsOverlay(url)
    cy.wait(10000)

    cy.get('dapplets-overlay-manager')
      .getByTestId('profile-widget', { includeShadowDom: true })
      .click()

    cy.get('dapplets-overlay-manager')
      .find('[data-testid=profile-widget]', { includeShadowDom: true })
      .getByTestId('add-wallet-btn-profile-widget', { includeShadowDom: true })
      .click()

    cy.wait(4000)

    cy.get('dapplets-overlay-manager').find('[data-testid=popup-item]', { includeShadowDom: true })

    cy.wait(4000)

    cy.get('dapplets-overlay-manager')
      .find('[data-testid=profile-widget]', { includeShadowDom: true })
      .contains('0x87e1...beC1', { includeShadowDom: true })
  })
  // )
})
