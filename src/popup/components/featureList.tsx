import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import store from "../store";

import { Button, Image, List, Checkbox, Segment } from "semantic-ui-react";

interface IFeaturesListProps {

}

interface IFeaturesListState {
  features: any[];

  isLoading: boolean;
}

class FeatureList extends React.Component<IFeaturesListProps, IFeaturesListState> {
  constructor(props) {
    super(props);

    this.state = {
      features: [],
      isLoading: true
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { getFeaturesByHostname } = backgroundFunctions;

    var features = await getFeaturesByHostname(store.currentHostname) || [];

    // TODO: loader spinner
    this.setState({
      features,
      isLoading: false
    });
  }

  async handleSwitchChange({ name, version }, value) {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { activateFeature, deactivateFeature } = backgroundFunctions;

    if (value) {
      await activateFeature(name, version, store.currentHostname);
    } else {
      await deactivateFeature(name, version, store.currentHostname);
    }

    this.setState(state => {
      const features = state.features.map(feature => {
        if (feature.name == name) {
          feature.isActive = value;
        }
        return feature;
      });

      return { features };
    });
  }

  render() {
    const { features, isLoading } = this.state;
    return (
      <React.Fragment>
        <Segment loading={isLoading}>
          {(features.length > 0) ? (
            <List divided relaxed style={{ width: 350 }}>
              {features.map(f => (
                <List.Item key={f.name} style={{ overflow: "hidden" }}>
                  <List.Content style={{ width: 45, float: "left" }}>
                    <div>
                      <Image
                        size="mini"
                        avatar
                        alt={f.description}
                        src={f.icon}
                      />
                    </div>
                  </List.Content>
                  {f.hasUpdate ? ( // ToDo: hasUpdate isn't implemented in DTO
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
                            this.handleSwitchChange(f, !f.isActive)
                          }
                          checked={f.isActive}
                        />
                      </List.Content>
                    )}
                  <List.Content
                    style={{
                      marginLeft: 45,
                      marginRight: f.hasUpdate ? 60 : 60
                    }}
                  >
                    <List.Header>{f.title}</List.Header>
                    <List.Description style={{ color: "#666" }}>
                      {f.description}
                      <br />
                      Author: {f.author}
                      <br />
                      Version: {f.version}
                    </List.Description>
                  </List.Content>
                </List.Item>
              ))}
            </List>
          ) : (
              <div>No available features for current site.</div>
            )}
        </Segment>
      </React.Fragment>
    );
  }
}

export default FeatureList;
