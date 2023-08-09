// import { qase } from 'cypress-qase-reporter/dist/mocha'

// const urlToOpen = 'https://twitter.com/teremovskii'
// const dappletIdToActivate = 'inject-via-activate'
// const dappletNameToActivate = 'Inject via activate'
// const devServerUrl = 'http://localhost:3000/dapplet.json'

// describe(dappletNameToActivate, () => {
//   qase(
//     144,
//     it(dappletNameToActivate, () => {
//       // open overlay
//       cy.openDappletsOverlay(urlToOpen)

//       // turn on the dev server
//       cy.getByTestId('system-tab-settings').click()
//       cy.getByTestId('settings-page-developer').click()
//       cy.getByTestId('dev-server')
//         .contains(devServerUrl)
//         .parent()
//         .parent()
//         .find('button')
//         .contains('Disabled')
//         .click()
//       cy.wait(3000)
//       cy.getByTestId('system-tab-dapplets').click()

//       // find the dapplet
//       cy.get('dapplets-overlay-manager').contains(dappletNameToActivate, {
//         timeout: 30000,
//         includeShadowDom: true,
//       })

//       // widget does not exist
//       cy.get('.dapplet-widget').should('not.exist')

//       // activate CA dapplet
//       cy.runDapplet(dappletIdToActivate)

//       // widget exists
//       cy.get('.dapplet-widget')
//     })
//   )
// })
