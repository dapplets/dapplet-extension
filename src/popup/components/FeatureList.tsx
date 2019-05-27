import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import store from "../store";

import { Button, Image, List, Checkbox, Segment } from "semantic-ui-react";

interface IInjectorListProps {

}

interface IInjectorListState {
  injectors: any[];

  isLoading: boolean;
}

class FeatureList extends React.Component<IInjectorListProps, IInjectorListState> {
  constructor(props) {
    super(props);

    this.state = {
      injectors: [],
      isLoading: true
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { getFeaturesByHostname } = backgroundFunctions;

    var injectors = await getFeaturesByHostname(store.currentHostname) || [];

    // TODO: loader spinner
    this.setState({
      injectors: injectors,
      isLoading: false
    });
  }

  async handleSwitchChange(injector, value) {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { activateFeature, deactivateFeature } = backgroundFunctions;

    if (value) {
      await activateFeature(injector.id, store.currentHostname);
    } else {
      await deactivateFeature(injector.id, store.currentHostname);
    }

    this.setState(state => {
      const injectors = state.injectors.map(item => {
        if (item.id == injector.id) {
          item.isActive = value;
          return item;
        } else {
          return item;
        }
      });

      return {
        injectors
      };
    });
  }

  render() {
    const { injectors, isLoading } = this.state;
    return (
      <React.Fragment>
        <Segment loading={isLoading}>
          {(injectors.length > 0) ? (
            <List divided relaxed style={{ width: 350 }}>
              {injectors.map(injector => (
                <List.Item key={injector.id} style={{ overflow: "hidden" }}>
                  <List.Content style={{ width: 45, float: "left" }}>
                    <div>
                      <Image
                        size="mini"
                        avatar
                        alt={injector.description}
                        src={injector.icon}
                      />
                    </div>
                  </List.Content>
                  {injector.hasUpdate ? ( // ToDo: hasUpdate isn't implemented in DTO
                    <List.Content style={{ float: "right", width: 60 }}>
                      <Button
                        primary
                        size="mini"
                        style={{ padding: 5, width: 55 }}
                      >
                        Update
                    </Button>
                      <Button
                        size="mini"
                        style={{ padding: 5, marginTop: 5, width: 55 }}
                      >
                        Skip
                    </Button>
                    </List.Content>
                  ) : (
                      <List.Content style={{ float: "right", width: 60 }}>
                        <Checkbox
                          toggle
                          style={{ marginTop: 5 }}
                          onChange={() =>
                            this.handleSwitchChange(injector, !injector.isActive)
                          }
                          checked={injector.isActive}
                          disabled={injector.isDev}
                        />
                      </List.Content>
                    )}
                  <List.Content
                    style={{
                      marginLeft: 45,
                      marginRight: injector.hasUpdate ? 60 : 60
                    }}
                  >
                    <List.Header>{injector.name}</List.Header>
                    <List.Description style={{ color: "#666" }}>
                      {injector.description}
                      <br />
                      Author: {injector.author}
                      <br />
                      Version: {injector.version}
                    </List.Description>
                  </List.Content>
                </List.Item>
              ))}
            </List>
          ) : (
              <div>No available injectors for current site.</div>
            )}
        </Segment>
      </React.Fragment>
    );
  }
}

export default FeatureList;
