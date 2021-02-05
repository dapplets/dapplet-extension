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
  isOverlay: boolean;
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
    if (this.props.isOverlay) {
      await pairWalletViaOverlay();
      await this.componentDidMount();
    } else {
      pairWalletViaOverlay();
      window.close();
    }
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
        <Segment className={(this.props.isOverlay) ? undefined : "internalTab"} style={{ marginTop: (this.props.isOverlay) ? 0 : undefined }}>
          {(connectedDescriptors.length > 0) ?
            <Comment.Group>
              {connectedDescriptors.map((x, i) => (
                <div key={i} style={{ marginBottom: '10px', display: 'flex', boxShadow: '0 0 0 1px rgba(34,36,38,.15) inset', borderRadius: '.28571429rem', padding: '.78571429em 1.5em .78571429em' }}>
                  {(x.account) ? <img src={makeBlockie(x.account)} style={{ width: '38px', height: '38px', borderRadius: '4px', margin: '2px 0' }} /> : null}
                  <div style={{ flex: 'auto', marginLeft: '10px' }}>
                    <div style={{ display: 'inline', color: 'rgba(0,0,0,.4)' }}>
                      {/* {(x.default) ? <Icon name='star' /> : <Icon link name='star outline' onClick={() => this.setWalletFor(x.type)} />} */}
                      {(x.account) ? <span title={x.account} style={{ color: '#000', fontWeight: 'bold' }}>{x.account.substr(0, 6) + '...' + x.account.substr(38)}</span> : null}
                      <CheckIcon text='Copied' name='copy' style={{ marginLeft: '4px' }} onClick={() => navigator.clipboard.writeText(x.account)} />
                    </div>
                    {/* <Comment.Author style={{ display: 'inline' }}>{x.account}</Comment.Author> */}
                    {/* <Icon link name='external' onClick={() => window.open(`https://${(x.chainId === 1) ? '' : networkName(x.chainId) + '.'}etherscan.io/address/${x.account}`, '_blank')} /> */}
                    <div>
                      {walletIcons[x.type] ? <img style={{ width: '16px', position: 'relative', top: '3px' }} src={walletIcons[x.type]} /> : null}
                      {x.meta?.icon ? <img style={{ width: '16px', position: 'relative', top: '3px', marginLeft: '3px' }} src={x.meta.icon} /> : null}
                      {(x.lastUsage) ? <span style={{ marginLeft: '6px', color: 'rgba(0,0,0,.4)' }}><ReactTimeAgo date={new Date(x.lastUsage)} locale="en-US" /></span> : null}
                      {/* <span style={{ marginLeft: '0.5em' }}>{networkName(x.chainId)}</span> */}
                    </div>
                  </div>
                  <div>
                    <Button onClick={() => this.disconnectButtonClick(x.type)} size='tiny' style={{ margin: '5px 0' }}>Disconnect</Button>
                  </div>
                </div>
              ))}
            </Comment.Group> :
            <div style={{ marginBottom: '10px' }}>No connected wallets</div>}

          <Button onClick={() => this.connectWallet()}>Connect</Button>

        </Segment>
      </React.Fragment>
    );
  }
}

export default Wallets;
