import * as React from "react";
import Features from "../components/features";
import Header from "../components/header";
import Wallets from "../components/wallets";
import Settings from "../components/settings";
import Events from "../components/events";
import './popup.scss';

import { Tab, Menu, Label } from "semantic-ui-react";

class Popup extends React.Component {
  render() {
    const panes = [
      {
        menuItem: "Features",
        render: () => (
          <Tab.Pane attached={false} as={Features} />
        )
      },
      {
        menuItem: (
          <Menu.Item key='messages'>
            Events<Label color='red'  circular size='mini'>15</Label>
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
          <Tab.Pane attached={false} as={Settings} />
        )
      }
    ];

    return (
      <React.Fragment>
        <div className="popupContainer">
          <Header />
          <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
        </div>
      </React.Fragment>
    );
  }
}

export default Popup;
