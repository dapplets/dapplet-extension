import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';

import { List, Button, Segment } from "semantic-ui-react";

interface IWalletsProps {

}

interface IWalletsState {
  isConnected: boolean;
  chainId: any; // TODO: what kind of type?
  accounts: any[];
}

class Wallets extends React.Component<IWalletsProps, IWalletsState> {
  constructor(props) {
    super(props);

    this.state = {
      isConnected: false,
      chainId: null,
      accounts: []
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(extension);
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
    var backgroundFunctions = await initBGFunctions(extension);
    const { disconnect } = backgroundFunctions;
    await disconnect();
    await this.componentDidMount();
  }

  async connectWallet() {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, "OPEN_PAIRING_OVERLAY");
      window.close();
    });
  }

  render() {
    const { isConnected, chainId, accounts } = this.state;

    return (
      <React.Fragment>
        <Segment>
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
          {!isConnected && (
            <Button onClick={() => this.connectWallet()}>Connect</Button>
          )}
        </Segment>
      </React.Fragment>
    );
  }
}

export default Wallets;
