///<reference types="cypress-iframe" />

import 'cypress-iframe'

Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid="${selector}"]`, ...args)
})
