import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';

import { Button, Image, List, Checkbox, Segment, Message, Popup } from "semantic-ui-react";
import ManifestDTO from "../../background/dto/manifestDTO";

interface IFeaturesProps {
  contextIds: string[] | undefined;
}

interface IFeaturesState {
  features: ManifestDTO[];
  isLoading: boolean;
  error: string;
  isNoInpage: boolean;
}

class FeatureList extends React.Component<IFeaturesProps, IFeaturesState> {
  constructor(props) {
    super(props);

    this.state = {
      features: [],
      isLoading: true,
      error: null,
      isNoInpage: false
    };
  }

  async componentDidMount() {
    const { contextIds } = this.props;
    if (contextIds === undefined) {
      this.setState({ isNoInpage: true, isLoading: false });
      return;
    }

    const { getFeaturesByHostnames } = await initBGFunctions(extension);

    try {
      const features: ManifestDTO[] = await getFeaturesByHostnames(contextIds);
      this.setState({
        features,
        isLoading: false,
        error: null
      });
    } catch {
      this.setState({
        error: "The registry is not available.",
        isLoading: false
      });
    }
  }

  async handleSwitchChange({ name, version, hostnames }, value) {
    const backgroundFunctions = await initBGFunctions(extension);
    const { activateFeature, deactivateFeature } = backgroundFunctions;
    this.setState(state => {
      const features = state.features.map(feature => {
        if (feature.name == name) {
          feature.isActive = value;
        }
        return feature;
      });

      return { features };
    });

    if (value) {
      await activateFeature(name, version, hostnames);
    } else {
      await deactivateFeature(name, version, hostnames);
    }
  }

  refreshContextPage() {
    extension.tabs.query({
      active: true,
      currentWindow: true
    }, ([{ id, url }]) => {
      chrome.tabs.update(id, { url });
      window.close();
    });
  }

  render() {
    const { features, isLoading, error, isNoInpage } = this.state;
    return (
      <React.Fragment>
        <Segment loading={isLoading} className="internalTab">
          {!isNoInpage ?
            (!error) ? ((features.length > 0) ? (
              <List divided relaxed>
                {features.map(f => (
                  <List.Item key={f.name} style={{ overflow: "hidden" }}>
                    <List.Content style={{ width: 45, float: "left" }}>
                      <div>
                        <Popup
                          content={<List>{f.hostnames?.map(h => <List.Item>{h}</List.Item>)}</List>}
                          header="Related Context IDs"
                          trigger={<Image
                            size="mini"
                            avatar
                            alt={f.description}
                            src={f.icon}
                          />}
                        />
                      </div>
                    </List.Content>
                    {false ? ( // ToDo: hasUpdate isn't implemented in DTO
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
                        marginRight: 60
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
            ) : (<div>No available features for current site.</div>)) : (<Message floating negative>{error}</Message>)
            : (<div>
              No connection with context webpage.
              <br />
              Please refresh it.
              <br />
              <Button
                compact
                size='tiny'
                color='blue'
                content='Refresh'
                onClick={() => this.refreshContextPage()}
              />
            </div>)}
        </Segment>
      </React.Fragment>
    );
  }
}

export default FeatureList;
