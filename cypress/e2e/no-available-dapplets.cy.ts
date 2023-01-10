import { qase } from 'cypress-qase-reporter/dist/mocha'

const url = 'https://docs.dapplets.org/'

describe('No available dapplets', () => {
  qase(
    4,
    it('No available dapplets', () => {
      // open overlay
      cy.openDappletsOverlay(url)

      // should have no dapplets in the list
      cy.get('dapplets-overlay-manager').contains('No available dapplets for current site.', {
        timeout: 30000,
        includeShadowDom: true,
      })
    })
  )
})
