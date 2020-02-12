import * as React from "react";
import * as extension from 'extensionizer';
import { Tab, Menu, Label } from "semantic-ui-react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import Features from "../components/features";
import Header from "../components/header";
import Wallets from "../components/wallets";
import Settings from "../components/settings";
import Developer from "../components/developer";
import Events from "../components/events";
import './popup.scss';

interface IPopupProps {
  contextIds: string[];
}
interface IPopupState {
  newEventsCount: number;
  devMode: boolean;
}

class Popup extends React.Component<IPopupProps, IPopupState> {
  constructor(props) {
    super(props);

    this.state = {
      newEventsCount: 0,
      devMode: false
    };
  }

  async componentDidMount() {
    await this.updateTabs();
  }

  async updateTabs() {
    const { getNewEventsCount, getDevMode } = await initBGFunctions(extension);
    const newEventsCount: number = await getNewEventsCount();
    const devMode = await getDevMode();
    this.setState({ newEventsCount, devMode });
  }

  render() {
    const { contextIds } = this.props;
    const { newEventsCount, devMode } = this.state;

    const panes = [
      {
        menuItem: "Features",
        render: () => (
          <Tab.Pane attached={false} as={() => <Features contextIds={contextIds} />} />
        )
      },
      {
        menuItem: (
          <Menu.Item key='messages'>
            Events{newEventsCount !== 0 ? <Label color='red' circular size='mini'>{newEventsCount}</Label> : null}
          </Menu.Item>
        ),
        render: () => (
          <Tab.Pane attached={false} as={Events} />
        )
      },
      {
        menuItem: "Wallets",
        render: () => (
          <Tab.Pane attached={false} as={Wallets} />
        )
      },
      {
        menuItem: "Settings",
        render: () => (
          <Tab.Pane attached={false} as={() => <Settings devMode={devMode} updateTabs={() => this.updateTabs()} />} />
        )
      }
    ];

    if (devMode) {
      panes.push({
        menuItem: "Developer",
        render: () => (
          <Tab.Pane attached={false} as={Developer} />
        )
      });
    }

    return (
      <React.Fragment>
        <div className="popupContainer">
          <Header contextIds={this.props.contextIds} />
          <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
        </div>
      </React.Fragment>
    );
  }
}

export default Popup;
