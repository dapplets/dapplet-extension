import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import { List, Button, Form } from "semantic-ui-react";

interface ISettingsProps {

}

interface ISettingsState {
  isConnected: boolean;
  chainId: any; // TODO: what kind of type?
  accounts: any[];
}

class Settings extends React.Component<ISettingsProps, ISettingsState> {
  constructor(props) {
    super(props);

    this.state = {
      isConnected: false,
      chainId: null,
      accounts: []
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { checkConnection, getChainId, getAccounts } = backgroundFunctions;

    var isConnected = await checkConnection();
    var chainId = await getChainId();
    var accounts = await getAccounts();

    this.setState({
      isConnected,
      chainId,
      accounts
    });
  }

  async disconnectButtonClick() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { disconnect } = backgroundFunctions;
    await disconnect();
    await this.componentDidMount();
  }

  render() {
    const { isConnected, chainId, accounts } = this.state;

    return (
      <React.Fragment>
        <List>
          <List.Item>
            <List.Header>Wallet Connection</List.Header>
            <List.Description>
              {isConnected ? "Connected" : "Disconnected"}
            </List.Description>
          </List.Item>

          {isConnected && (
            <React.Fragment>
              <List.Item>
                <List.Header>Chain ID</List.Header>
                <List.Description>{chainId}</List.Description>
              </List.Item>
              <List.Item>
                <List.Header>Accounts</List.Header>
                <List.Description>{accounts.join(", ")}</List.Description>
              </List.Item>
            </React.Fragment>
          )}
        </List>
        {isConnected && (
          <Button onClick={() => this.disconnectButtonClick()}>
            Disconnect wallet
          </Button>
        )}
      </React.Fragment>
    );
  }
}

export default Settings;
