import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { Tab, Menu, Label } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import Dapplets from "./dapplets";
import Header from "../components/header";
import Wallets from "./wallets";
import Settings from "./settings";
import Developer from "./developer";
import Events from "./events";
import "./popup.scss";
import { Bus } from "../../common/bus";
import { ShareButton } from "../components/ShareButton";

interface IPopupProps {
  bus: Bus;
}

interface IPopupState {
  newEventsCount: number;
  devMode: boolean;
  loading: boolean;
  defaultActiveIndex: number | undefined;
  reload: number;
  isOverlay: boolean;
  currentTab: { id: number, windowId: number } | null;
}

class Popup extends React.Component<IPopupProps, IPopupState> {
  constructor(props) {
    super(props);

    this.state = {
      newEventsCount: 0,
      devMode: false,
      loading: true,
      defaultActiveIndex: undefined,
      reload: 0,
      isOverlay: (window['DAPPLETS_JSLIB'] !== true) ? false : true,
      currentTab: null
    };

    props.bus.subscribe("changeTab", (path, currentTab) => {
      this.setState({ isOverlay: true });
      if (path === "dapplets") {
        this.setState({ defaultActiveIndex: 0, currentTab, reload: Math.random() });
      } else if (path === 'events') {
        this.setState({ defaultActiveIndex: 1, reload: Math.random() });
      } else if (path === "wallets") {
        this.setState({ defaultActiveIndex: 2, currentTab, reload: Math.random() });
      } else if (path === "settings") {
        this.setState({ defaultActiveIndex: 3, currentTab, reload: Math.random() });
      } else if (path === "developer") {
        this.setState({ defaultActiveIndex: 4, currentTab, reload: Math.random() });
      }
    });
  }

  async componentDidMount() {
    await this.updateTabs();
  }

  async updateTabs() {
    const { getNewEventsCount, getDevMode } = await initBGFunctions(browser);
    const newEventsCount: number = await getNewEventsCount();
    const devMode = await getDevMode();
    this.setState({ newEventsCount, devMode, loading: false });
  }

  render() {
    const { newEventsCount, devMode, loading } = this.state;

    // If don't return null, it will be rendered twice
    if (loading) return null;

    const panes = [
      {
        menuItem: (
          <Menu.Item key="dapplets" style={{ padding: ".85714286em 0.8em" }}>
            Dapplets
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane
            attached={false}
            as={() => (
              <Dapplets
                currentTab={this.state.currentTab}
                isOverlay={this.state.isOverlay}
              />
            )}
          />
        ),
      },
      {
        menuItem: (
          <Menu.Item key='messages' style={{ padding: '.85714286em 0.8em' }}>
            Events{newEventsCount !== 0 ? <Label color='red' circular size='mini'>{newEventsCount}</Label> : null}
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane attached={false} as={() => <Events isOverlay={this.state.isOverlay}/>} />
        )
      },
      {
        menuItem: (
          <Menu.Item key="wallets" style={{ padding: ".85714286em 0.8em" }}>
            Wallets
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane
            attached={false}
            as={() => <Wallets isOverlay={this.state.isOverlay} />}
          />
        ),
      },
      {
        menuItem: (
          <Menu.Item key="settings" style={{ padding: ".85714286em 0.8em" }}>
            Settings
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane
            attached={false}
            as={() => (
              <Settings
                devMode={devMode}
                updateTabs={() => this.updateTabs()}
                isOverlay={this.state.isOverlay}
              />
            )}
          />
        ),
      },
    ];

    if (devMode) {
      panes.push({
        menuItem: (
          <Menu.Item key="developer" style={{ padding: ".85714286em 0.8em" }}>
            Developer
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane
            attached={false}
            as={() => <Developer isOverlay={this.state.isOverlay} />}
          />
        ),
      });
    }

    return (
      <React.Fragment>
        {(!this.state.isOverlay) ? <div
          style={{
            position: "absolute",
            top: "15px",
            right: "10px",
            display: 'flex'
          }}
        >
          <ShareButton />
        </div> : null}

        <div
          className={
            this.state.isOverlay ? "popupContainer" : "popupContainer popup"
          }
          key={this.state.reload}
        >
          {/* {this.state.contextIds ? (
            <Header contextIds={this.state.contextIds} />
          ) : null} */}
          <Tab
            menu={{
              secondary: true,
              pointing: true,
              style: { display: this.state.isOverlay ? "none" : undefined },
            }}
            panes={panes}
            defaultActiveIndex={this.state.defaultActiveIndex}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default Popup;
