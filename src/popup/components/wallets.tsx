import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { List, Button, Segment, Comment, Icon } from "semantic-ui-react";
import { WalletInfo } from "../../common/constants";
import { DefaultSigners, WalletDescriptor } from "../../background/services/walletService";
import makeBlockie from 'ethereum-blockies-base64';
import ReactTimeAgo from 'react-time-ago';

import * as walletIcons from '../../common/resources/wallets';
import { networkName } from "../../common/helpers";
import { CheckIcon } from "../../common/react-components/CheckIcon";

interface IWalletsProps {

}

interface IWalletsState {
  descriptors: WalletDescriptor[];
  //walletInfo: WalletInfo;
  loading: boolean;
}

class Wallets extends React.Component<IWalletsProps, IWalletsState> {
  constructor(props) {
    super(props);

    this.state = {
      descriptors: [],
      loading: true
      //walletInfo: null
    };
  }

  async componentDidMount() {
    const { getWalletDescriptors, getGlobalConfig } = await initBGFunctions(browser);

    const descriptors = await getWalletDescriptors();
    //const { walletInfo } = await getGlobalConfig();

    this.setState({
      descriptors,
      loading: false
      //walletInfo
    });
  }

  async disconnectButtonClick(wallet: string) {
    const { disconnectWallet } = await initBGFunctions(browser);
    await disconnectWallet(wallet);
    await this.componentDidMount();
  }

  async connectWallet() {
    const { pairWalletViaOverlay } = await initBGFunctions(browser);
    pairWalletViaOverlay();
    window.close();
  }

  async setWalletFor(type: string) {
    const { setWalletFor } = await initBGFunctions(browser);
    await setWalletFor(type, DefaultSigners.EXTENSION);
    await this.componentDidMount();
  }

  render() {
    const { descriptors, loading } = this.state;

    if (loading) return null;

    const connectedDescriptors = descriptors.filter(x => x.connected);

    return (
      <React.Fragment>
        <Segment className="internalTab">
          {(connectedDescriptors.length > 0) ? 
          <Comment.Group>
            {connectedDescriptors.map((x, i) => (
              <Comment key={i}>
                {(x.account) ? <Comment.Avatar src={makeBlockie(x.account)} /> : null}
                <Comment.Content>
                  <Comment.Author style={{ display: 'inline' }}>
                    {(x.default) ? <Icon name='star' /> : <Icon link name='star outline' onClick={() => this.setWalletFor(x.type)} />}
                    {(x.account) ? x.account.substr(0, 6) + '...' + x.account.substr(38) : null}
                  </Comment.Author>
                  {/* <Comment.Author style={{ display: 'inline' }}>{x.account}</Comment.Author> */}
                  <Comment.Metadata>
                    <CheckIcon text='Copied' name='copy' onClick={() => navigator.clipboard.writeText(x.account)} />
                    <Icon link name='external' onClick={() => window.open(`https://${(x.chainId === 1) ? '' : networkName(x.chainId) + '.'}etherscan.io/address/${x.account}`, '_blank')} />
                    {(x.lastUsage) ? <ReactTimeAgo date={new Date(x.lastUsage)} locale="en-US"/> : null}
                  </Comment.Metadata>
                  <Comment.Text>
                    {walletIcons[x.type] ? <img style={{ width: '16px' }} src={walletIcons[x.type]} /> : null}
                    {x.meta?.icon ? <img style={{ width: '16px' }} src={x.meta.icon} /> : null}
                    <span style={{ marginLeft: '0.5em' }}>{networkName(x.chainId)}</span>
                  </Comment.Text>
                  <Comment.Actions>
                    <Comment.Action onClick={() => this.disconnectButtonClick(x.type)}>Disconnect</Comment.Action>
                  </Comment.Actions>
                </Comment.Content>
              </Comment>
            ))}
          </Comment.Group> : 
          <div style={{ marginBottom: '10px'}}>No connected wallets</div>}

          <Button onClick={() => this.connectWallet()}>Connect</Button>

        </Segment>
      </React.Fragment>
    );
  }
}

export default Wallets;
