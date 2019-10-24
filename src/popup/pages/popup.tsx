import * as React from "react";
import FeatureList from "../components/featureList";
import Header from "../components/header";
import Wallets from "../components/wallets";
import Dev from "../components/dev";
import './popup.scss';

import { Tab } from "semantic-ui-react";

class Popup extends React.Component {
  render() {
    const panes = [
      {
        menuItem: "Features",
        render: () => (
          <Tab.Pane attached={false} as={FeatureList}/>
        )
      },
      {
        menuItem: "Wallets",
        render: () => (
          <Tab.Pane attached={false} as={Wallets}/>
        )
      },
      {
        menuItem: "Dev",
        render: () => (
          <Tab.Pane attached={false} as={Dev}/>
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
