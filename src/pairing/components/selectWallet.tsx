import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Container, Header, Button, Image, Comment, Icon } from 'semantic-ui-react'
import { Link } from "react-router-dom";
import * as logos from '../../common/resources/wallets';
import { WalletDescriptor } from "../../background/services/walletService";

import makeBlockie from 'ethereum-blockies-base64';
import ReactTimeAgo from 'react-time-ago';
import { CheckIcon } from "../../common/react-components/CheckIcon";
import * as walletIcons from '../../common/resources/wallets';
import { networkName } from "../../common/helpers";
import { Bus } from "../../common/bus";

interface ISelectWalletProps {
    bus: Bus;
}

interface ISelectWalletState {
    loading: boolean;
    descriptors: WalletDescriptor[];
}

export class SelectWallet extends React.Component<ISelectWalletProps, ISelectWalletState> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            descriptors: []
        }
    }

    async componentDidMount() {
        const { getWalletDescriptors } = await initBGFunctions(browser);
        const descriptors = await getWalletDescriptors();

        this.setState({
            descriptors,
            loading: false
        });
    }

    async disconnectButtonClick(wallet: string) {
        const { disconnectWallet } = await initBGFunctions(browser);
        await disconnectWallet(wallet);
        await this.componentDidMount();
    }

    private _openMetamaskWebpage() {
        window.open('https://metamask.io/', '_blank');
        this.props.bus.publish('ready');
    }

    render() {
        if (this.state.loading) return null;

        const connectedWallets = this.state.descriptors.filter(x => x.connected);
        const disconnectedWallets = this.state.descriptors.filter(x => !x.connected);

        return (
            <>
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
                                    {/* <Comment.Actions>
                                        <Comment.Action onClick={() => this.disconnectButtonClick(x.type)}>Disconnect</Comment.Action>
                                    </Comment.Actions> */}
                                </div>
                                <div>
                                    <Button onClick={() => this.disconnectButtonClick(x.type)} size='tiny' style={{ margin: '5px 0' }}>Disconnect</Button>
                                </div>
                            </div>
                        ))}
                    </Comment.Group>
                </> : null}

                {(disconnectedWallets.length > 0) ? <>
                    <Header as='h3'>Connect a new wallet</Header>

                    {(!this.state.descriptors.find(x => x.type === 'metamask').connected) ?
                        (this.state.descriptors.find(x => x.type === 'metamask').available) ?
                            <Button
                                // disabled={this.state.descriptors.find(x => x.type === 'metamask').available === false}
                                basic
                                fluid
                                size='large'
                                onClick={() => window.location.hash = '/metamask'}
                                style={{ height: '64px', marginBottom: '10px' }}
                            >
                                <Image size='mini' verticalAlign='middle' src={logos.metamask} />{' '}
                                <span>MetaMask</span>
                            </Button> :
                            <Button
                                // disabled={this.state.descriptors.find(x => x.type === 'metamask').available === false}
                                basic
                                fluid
                                size='large'
                                onClick={() => this._openMetamaskWebpage()}
                                style={{ height: '64px', marginBottom: '10px' }}
                            >
                                <Image size='mini' verticalAlign='middle' src={logos.metamask} />{' '}
                                <span>Install MetaMask</span>
                            </Button> :
                        null}

                    {(!this.state.descriptors.find(x => x.type === 'walletconnect').connected) ?
                        <Button
                            // disabled={this.state.descriptors.find(x => x.type === 'walletconnect').available === false}
                            basic
                            fluid
                            size='large'
                            onClick={() => window.location.hash = '/walletconnect'}
                            style={{ height: '64px', marginBottom: '10px' }}
                        >
                            <Image size='mini' verticalAlign='middle' src={logos.walletconnect} />{' '}
                            <span>WalletConnect</span>
                        </Button> :
                        null}

                </> : null}
            </>
        );
    }
}