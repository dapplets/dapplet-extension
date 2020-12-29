import * as React from "react";
import { browser } from "webextension-polyfill-ts";
import { Tab, Menu, Label } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import Dapplets from "../components/dapplets";
import Header from "../components/header";
import Wallets from "../components/wallets";
import Settings from "../components/settings";
import Developer from "../components/developer";
import Events from "../components/events";
import './popup.scss';
import { Bus } from "../../common/bus";

interface IPopupProps {
  contextIds: Promise<string[]>;
  bus: Bus;
}
interface IPopupState {
  newEventsCount: number;
  devMode: boolean;
  loading: boolean;
  defaultActiveIndex: number | undefined;
  reload: number;
}

class Popup extends React.Component<IPopupProps, IPopupState> {

  constructor(props) {
    super(props);

    this.state = {
      newEventsCount: 0,
      devMode: false,
      loading: true,
      defaultActiveIndex: undefined,
      reload: 0
    };

    props.bus.subscribe('changeTab', (path) => {
      if (path === 'dapplets') this.setState({ defaultActiveIndex: 0, reload: Math.random() });
      //if (path === 'events') this.setState({ defaultActiveIndex: 1, reload: Math.random() });
      if (path === 'wallets') this.setState({ defaultActiveIndex: 1, reload: Math.random() });
      if (path === 'settings') this.setState({ defaultActiveIndex: 2, reload: Math.random() });
      if (path === 'developer') this.setState({ defaultActiveIndex: 3, reload: Math.random() });
    })
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
    const { contextIds } = this.props;
    const { newEventsCount, devMode, loading } = this.state;

    // If don't return null, it will be rendered twice
    if (loading) return null;

    const panes = [
      {
        menuItem: <Menu.Item key='dapplets' style={{ padding: '.85714286em 0.8em' }}>Dapplets</Menu.Item>,
        render: () => (
          <Tab.Pane attached={false} as={() => <Dapplets contextIds={contextIds} />} />
        )
      },
      // {
      //   menuItem: (
      //     <Menu.Item key='messages' style={{ padding: '.85714286em 0.8em' }}>
      //       Events{newEventsCount !== 0 ? <Label color='red' circular size='mini'>{newEventsCount}</Label> : null}
      //     </Menu.Item>
      //   ),
      //   render: () => (
      //     <Tab.Pane attached={false} as={Events} />
      //   )
      // },
      {
        menuItem: <Menu.Item key='wallets' style={{ padding: '.85714286em 0.8em' }}>Wallets</Menu.Item>,
        render: () => (
          <Tab.Pane attached={false} as={Wallets} />
        )
      },
      {
        menuItem: <Menu.Item key='settings' style={{ padding: '.85714286em 0.8em' }}>Settings</Menu.Item>,
        render: () => (
          <Tab.Pane attached={false} as={() => <Settings devMode={devMode} updateTabs={() => this.updateTabs()} />} />
        )
      }
    ];

    if (devMode) {
      panes.push({
        menuItem: <Menu.Item key='developer' style={{ padding: '.85714286em 0.8em' }}>Developer</Menu.Item>,
        render: () => (
          <Tab.Pane attached={false} as={Developer} />
        )
      });
    }

    return (
      <React.Fragment>
        <div className="popupContainer" key={this.state.reload}>
          {(this.props.contextIds) ? <Header contextIds={this.props.contextIds} /> : null}
          <Tab menu={{ secondary: true, pointing: true }} panes={panes} defaultActiveIndex={this.state.defaultActiveIndex}/>
        </div>
      </React.Fragment>
    );
  }
}

export default Popup;
