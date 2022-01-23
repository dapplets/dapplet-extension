import * as React from "react";
import INNER_STYLE from "!raw-loader!./overlay.css";
import { Overlay } from "./overlay";

interface P {
  onToggle: () => void;
  overlays: Overlay[];
}

interface S {}

export class App extends React.Component<P, S> {
  constructor(props: P) {
    super(props);
  }

  render() {
    const overlays = this.props.overlays;

    return (
      <>
        <style>{INNER_STYLE}</style>
        <div className="dapplets-overlay-bucket-bar"></div>
        <div className="dapplets-overlay-toolbar">
          <ul>
            <li>
              <button
                title="Toggle Overlay"
                className="dapplets-overlay-frame-button dapplets-overlay-frame-button-sidebar-toggle"
                onClick={this.props.onToggle}
              >
                ⇄
              </button>
            </li>
          </ul>
        </div>
        <div className="dapplets-overlay-nav">
          <div className="dapplets-overlay-nav-top-panel">
            <div className="dapplets-overlay-nav-tab-list">
              {overlays.map((x) => (
                <div className="dapplets-overlay-nav-tab-item dapplets-overlay-nav-tab-item-active">
                  <div
                    title={x.title}
                    className="dapplets-overlay-nav-tab-item-title"
                  >
                    {x.title}
                  </div>
                  <div className="dapplets-overlay-nav-tab-item-close-btn">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="4 4 16 16"
                      style={{ width: "10px" }}
                    >
                      <path d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <div className="dapplets-overlay-nav-top-actions">
              <div className="dapplets-action-dropdown">
                <button>
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="bars"
                    className="svg-inline--fa fa-bars fa-w-14"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="currentColor"
                      d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"
                    ></path>
                  </svg>
                </button>
                <div>
                  <div>Dapplets</div>
                  <div>Wallets</div>
                  <div>Settings</div>
                  <div>Developer</div>
                </div>
              </div>
            </div>
          </div>
          <div className="dapplets-overlay-nav-content-list">
            {overlays.map((x) => (
              <div className="dapplets-overlay-nav-content-item dapplets-overlay-nav-content-item-active">
                <iframe
                  allow="clipboard-write"
                  src={x.uri}
                  allowFullScreen
                  name={"dapplet-overlay/" + x.id}
                ></iframe>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
