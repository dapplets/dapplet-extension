import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';

import { List, Button, Segment } from "semantic-ui-react";
import { WalletInfo } from "../../common/constants";

interface IWalletsProps {

}

interface IWalletsState {
  isConnected: boolean;
  chainId: any; // TODO: what kind of type?
  accounts: any[];
  walletInfo: WalletInfo;
}

class Wallets extends React.Component<IWalletsProps, IWalletsState> {
  constructor(props) {
    super(props);

    this.state = {
      isConnected: false,
      chainId: null,
      accounts: [],
      walletInfo: null
    };
  }

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(extension);
    const { checkConnection, getChainId, getAccounts, getGlobalConfig } = backgroundFunctions;

    const isConnected = await checkConnection();
    const chainId = await getChainId();
    const accounts = await getAccounts();
    const { walletInfo } = await getGlobalConfig();

    this.setState({
      isConnected,
      chainId,
      accounts,
      walletInfo
    });
  }

  async disconnectButtonClick() {
    var backgroundFunctions = await initBGFunctions(extension);
    const { disconnect } = backgroundFunctions;
    await disconnect();
    await this.componentDidMount();
  }

  async connectWallet() {
    extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      var activeTab = tabs[0];
      extension.tabs.sendMessage(activeTab.id, "OPEN_PAIRING_OVERLAY");
      window.close();
    });
  }

  render() {
    const { isConnected, chainId, accounts, walletInfo } = this.state;

    return (
      <React.Fragment>
        <Segment className="internalTab">
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
                <List.Item>
                  <List.Header>Dapplet Compatibility</List.Header>
                  <List.Description>{walletInfo?.compatible ? "Yes" : "No"}</List.Description>
                </List.Item>
                <List.Item>
                  <List.Header>Device</List.Header>
                  <List.Description>{walletInfo?.device?.manufacturer} {walletInfo?.device?.model}</List.Description>
                </List.Item>
                <List.Item>
                  <List.Header>Dapplet Protocol Version</List.Header>
                  <List.Description>{walletInfo?.protocolVersion}</List.Description>
                </List.Item>
                <List.Item>
                  <List.Header>Dapplet Engine Version</List.Header>
                  <List.Description>{walletInfo?.engineVersion}</List.Description>
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
