import { css } from 'lit'

export const styles = css`
  :host {
    z-index: 50100;
  }

  .avatar-badge {
    display: block;
  }

  .wrapper {
    position: absolute;
    display: flex;
    overflow: hidden;
    align-items: center;
  }

  .active {
    cursor: pointer;
  }

  .post-badge {
    width: 24px;
    height: 24px;
  }

  .profile-badge {
    width: 25%;
    min-width: 13px;
    height: 25%;
    min-height: 13px;
  }

  .not-basic {
    border-radius: 99em;
    background-color: white;
  }

  .not-basic.post-badge {
    border: 1px solid white;
  }

  .not-basic.profile-badge {
    border: 2px solid white;
  }

  .not-basic.dark {
    background-color: black;
  }

  .not-basic.dark.post-badge {
    border: 1px solid black;
  }

  .not-basic.dark.profile-badge {
    border: 2px solid black;
  }
`
