import * as React from "react";
import InjectorList from "../components/InjectorList";
import Header from "../components/Header";
import Settings from "../components/Settings";
import './Popup.scss';

import { Tab } from "semantic-ui-react";

class Popup extends React.Component {
  render() {
    const panes = [
      {
        menuItem: "Injectors",
        render: () => (
          <Tab.Pane attached={false}>
            <InjectorList />
          </Tab.Pane>
        )
      },
      {
        menuItem: "Settings",
        render: () => (
          <Tab.Pane attached={false}>
            <Settings />
          </Tab.Pane>
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
