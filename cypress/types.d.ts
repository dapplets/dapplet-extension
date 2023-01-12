export {}

declare global {
  interface Window extends WindowDapplets {}

  interface WindowDapplets {
    dapplets: InjectedDappletsApi
  }

  interface InjectedDappletsApi {
    openPopup(): Promise<void>
    addTrustedUser(account: string): Promise<void>
  }

  namespace Cypress {
    interface Chainable {
      getByTestId<E extends Node = HTMLElement>(
        testId: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
      ): Chainable<JQuery<E>>
      openDappletsOverlay(url: string): void
      runDapplet(dappletIdToActivate: string): void
    }
  }
}
