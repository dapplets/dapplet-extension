import React, { Component } from "react";
import InjectorList from "../components/InjectorList";
import Header from "../components/Header";
import Settings from "../components/Settings";
import Store from "../store";

import { Tab } from "semantic-ui-react";

class Index extends Component {
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
        <Header />
        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
      </React.Fragment>
    );
  }
}

export default Index;
