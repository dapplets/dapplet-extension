import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Header, Button, Comment, Icon, Message } from 'semantic-ui-react';

import makeBlockie from 'ethereum-blockies-base64';
import ReactTimeAgo from 'react-time-ago';
import { CheckIcon } from "../../common/react-components/CheckIcon";
import * as walletIcons from '../../common/resources/wallets';
import { Bus } from "../../common/bus";
import { ChainTypes, WalletDescriptor } from "../../common/types";

interface Props {
    app: string;
    chain: ChainTypes;
    bus: Bus;
}

interface State {
    loading: boolean;
    descriptors: WalletDescriptor[];
}

export class SelectWallet extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            descriptors: []
        }
    }

    async componentDidMount() {
        await this.loadData();
    }

    async loadData() {
        const { getWalletDescriptors } = await initBGFunctions(browser);
        const descriptors = await getWalletDescriptors();

        this.setState({
            descriptors,
            loading: false
        });
    }

    async selectWallet(wallet: string) {
        const { setWalletFor } = await initBGFunctions(browser);
        const { app, chain } = this.props;
        await setWalletFor(wallet, app, chain);
        this.props.bus.publish('ready');
        await this.componentDidMount();
    }

    async pairWallet() {
        const { pairWalletViaOverlay } = await initBGFunctions(browser);
        await pairWalletViaOverlay(this.props.chain);
        await this.loadData();
    }

    render() {
        const p = this.props,
              s = this.state;

        if (s.loading) return null;

        const connectedWallets = s.descriptors.filter(x => x.connected).filter(x => x.chain ? x.chain === p.chain : true);
        // const disconnectedWallets = s.descriptors.filter(x => !x.connected);

        return (
            <div style={{ padding: '30px 20px' }}>

                <Message>
                  <Message.Header>Select Wallet</Message.Header>
                  <p>You are choosing a wallet for <b>{p.app}</b> application in <b>{p.chain}</b> chain.</p>
                </Message>

                {(connectedWallets.length > 0) ? <>
                    <Header as='h3'>Your active wallet connections</Header>
                    <Comment.Group>
                        {connectedWallets.map((x, i) => (
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
                                    <Button primary onClick={() => this.selectWallet(x.type)} size='tiny' style={{ margin: '5px 0' }}>Select</Button>
                                </div>
                            </div>
                        ))}

                        <Message info style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <p>Don't see your account here? You can <b>change an active account</b> in a connected wallet or </p>
                            <Button color='olive' onClick={() => this.pairWallet()}>
                              Connect a new wallet
                            </Button>
                        </Message>
                    </Comment.Group>
                </> : <Message warning style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <p>No one of connected wallets is eligible to sign on behalf of the account you selected.</p>
                        <p>You can <b>change an active account</b> in a connected wallet or </p>
                        <Button color='olive' onClick={() => this.pairWallet()}>
                          Connect a new wallet
                        </Button>
                    </Message>}
            </div>
        );
    }
}