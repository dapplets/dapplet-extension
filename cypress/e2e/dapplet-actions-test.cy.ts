let title = 'new title'
describe('dapplets action test', () => {
    it('opens context webpage', () => {
      cy.visit('https://example.com')
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
  
     
    })

    it('activate test dapplet', ()=>{
        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .getByTestId('system-tab-Settings', { includeShadowDom: true })
        .click()
        .wait(5000)

        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .getByTestId('settings-page-Developer', { includeShadowDom: true })
        .click()

        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .wait(5000)
        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .getByTestId('input-add-localhost', { includeShadowDom: true })
        .type('http://localhost:3003/dapplet.json')

        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .getByTestId('button-add-localhost', { includeShadowDom: true })
        .then((button)=>{
          if( button.prop('disabled')){
            cy.get('dapplets-overlay-manager')
            .getByTestId('toggle-overlay-button', { includeShadowDom: true })
            .click()
          }else{
        cy.get('dapplets-overlay-manager',{ includeShadowDom: true })
        .getByTestId('button-add-localhost', { includeShadowDom: true })
        .click()
        .wait(5000);

        cy.get('dapplets-overlay-manager')
        .getByTestId('toggle-overlay-button', { includeShadowDom: true })
        .click()
          }
        })

        cy.get('dapplets-overlay-manager')
        .wait(5000)
        .getByTestId('activation-dapplet', { includeShadowDom: true })
        .first()
        .then((button)=>{
          button.hasClass('not-active-switch')&& cy.get('dapplets-overlay-manager').getByTestId('activation-dapplet', { includeShadowDom: true }).click()
      })
         
    })

    it('check dapplet attach-config', ()=>{
      cy.get('dapplets-overlay-manager')
      .wait(15000)
      .getByTestId('dapplet-active-button', { includeShadowDom: true }).should('exist')
    
    })


    it('check dapplet action title', ()=>{
      cy.get('dapplets-overlay-manager')
      .getByTestId('dapplet-active-button', { includeShadowDom: true })
      .first().invoke('prop','title').should('equal', 'new title')

      cy.get('dapplets-overlay-manager')
      .getByTestId('dapplet-active-button', { includeShadowDom: true })
      .first()
      .click()    
  })
  it('check dapplet action new title', ()=>{
    cy.get('dapplets-overlay-manager')
    .getByTestId('dapplet-active-button', { includeShadowDom: true })
    .first().invoke('prop','title').should('equal', 'new click') 
})

it('check dapplet dettach-config', ()=>{
  cy.get('dapplets-overlay-manager')
  .getByTestId('activation-dapplet', { includeShadowDom: true })
  .first().should('have.class','active-switch') 
  .click()

  cy.get('dapplets-overlay-manager')
    .getByTestId('dapplet-active-button', { includeShadowDom: true }).should('not.exist')

})
  })
  