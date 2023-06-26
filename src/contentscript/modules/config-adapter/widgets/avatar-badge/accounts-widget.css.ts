import { css } from 'lit'

export const styles = css`
  :host {
    z-index: 50200;
  }

  .dapplets-connected-accounts-wrapper {
    position: absolute;
    z-index: 99999;
    left: 16px;
    top: 264px;
    transition: opacity 0.2s, visibility 0.2s;
  }

  @media (max-width: 703px) {
    .dapplets-connected-accounts-wrapper {
      top: 38vw;
    }
  }

  .dapplets-connected-accounts-wrapper .accounts {
    position: absolute;
    display: flex;
    background-color: white;
    border-radius: 20px;
    padding: 11px;
    flex-direction: column;
    top: 62px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
  }

  .dapplets-connected-accounts-wrapper .account-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dapplets-connected-accounts-wrapper .account {
    position: relative;

    display: flex;
    align-items: center;

    width: fit-content;
    height: 40px;
    margin: 5px;
    padding: 2px 5px 2px 2px;

    border-radius: 200px;
    background-color: #eaf0f0;
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%);

    cursor: pointer;
  }

  .dapplets-connected-accounts-wrapper .account:hover {
    background-color: #dfe7e7;
  }

  .dapplets-connected-accounts-wrapper .account:active {
    background-color: #d1dcdc;
  }

  .dapplets-connected-accounts-wrapper .imgUser {
    display: inline-block;

    width: 36px;
    height: 36px;

    margin-right: 10px;

    border: 2px solid white;
    border-radius: 50%;
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 10%));
  }

  .dapplets-connected-accounts-wrapper .nameUser {
    color: #2a2a2a;

    font-family: sans-serif;
    font-size: 14px;
    font-weight: 400;
    font-style: normal;
    line-height: 100%;
    padding-right: 14px;
  }

  .dapplets-connected-accounts-wrapper .nameUserActive {
    background: #d9304f;
  }

  .dapplets-connected-accounts-wrapper .nameUserActive:hover {
    background-color: #cb2e4a;
  }

  .dapplets-connected-accounts-wrapper .nameUserActive:active {
    background-color: #bc2b45;
  }

  .dapplets-connected-accounts-wrapper .nameUserActive .nameUser {
    color: #fff;
  }

  .dapplets-connected-accounts-wrapper .copy-button {
    position: relative;
    display: flex;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-left: 5px;
    background-color: #f5f5f5;
    cursor: pointer;
    border: none;
    border-radius: 9em;
    box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
  }

  .dapplets-connected-accounts-wrapper .copy-button:hover {
    background-color: #eaf0f0;
  }

  .dapplets-connected-accounts-wrapper .copy-button:active {
    background-color: #dfe7e7;
  }

  .dapplets-connected-accounts-wrapper .copy-icon {
    width: 18px;
  }
`
