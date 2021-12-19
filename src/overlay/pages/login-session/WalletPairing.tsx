import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import * as logos from '../../../common/resources/wallets';
import { Bus } from "../../../common/bus";
import { ChainTypes, WalletDescriptor, WalletTypes } from "../../../common/types";
import { ConnectWallet } from './ConnectWallet';

interface IWalletPairingProps {
    bus: Bus;
    chains: ChainTypes[];
}

interface IWalletPairingState {
    loading: boolean;
    descriptors: WalletDescriptor[];
}

export class WalletPairing extends React.Component<IWalletPairingProps, IWalletPairingState> {
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

    async disconnectButtonClick(chain: ChainTypes, wallet: WalletTypes) {
        const { disconnectWallet } = await initBGFunctions(browser);
        await disconnectWallet(chain, wallet);
        await this.componentDidMount();
    }

    private _openMetamaskWebpage() {
        window.open('https://metamask.io/', '_blank');
        this.props.bus.publish('cancel');
    }

    getMeta(wallet: WalletTypes, chain: ChainTypes) {
        if (wallet === WalletTypes.METAMASK) {
            return {
                id: 'metamask',
                label: 'MetaMask',
                icon: logos.metamask
            }
        } else if (wallet === WalletTypes.WALLETCONNECT) {
            return {
                id: 'walletconnect',
                label: 'WalletConnect',
                icon: logos.walletconnect
            }
        } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_TESTNET) {
            return {
                id: 'near_testnet',
                label: 'NEAR Wallet (Testnet)',
                icon: logos.near
            }
        } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_MAINNET) {
            return {
                id: 'near_mainnet',
                label: 'NEAR Wallet (Mainnet)',
                icon: logos.near
            }
        } else if (wallet === WalletTypes.DAPPLETS) {
            return {
                id: 'dapplets',
                label: 'Built-in Test Only Wallet',
                icon: logos.dapplets
            }
        }
    }

    render() {
        const p = this.props;

        if (this.state.loading) return null;

        const connectedWallets = this.state.descriptors
            .filter(x => x.connected)
            .filter(x => p.chains.length > 0 ? p.chains.includes(x.chain) : true);

        const disconnectedWallets = this.state.descriptors
            .filter(x => !x.connected)
            .filter(x => p.chains.length > 0 ? p.chains.includes(x.chain) : true);

        // const chainsLabel = (p.chains.length > 0) ? <>{p.chains.map((x, i) => (i !== p.chains.length - 1) ? <b key={x}>{x}, </b> : <b key={x}>{x}</b>)} chain{(p.chains.length > 1) ? 's' : null}</> : <><b>any</b> chain</>;

        const wallets = disconnectedWallets.map(x => this.getMeta(x.type, x.chain));

        return (

            <ConnectWallet 
                onWalletClick={(id) => window.location.hash = '/pairing/' + id}
                wallets={wallets}
            />
            // <>
            //     {(p.chains) ? <Message
            //         header='Wallet Pairing'
            //         content={<>You are pairing a wallet for {chainsLabel}.</>}
            //     /> : null}

            //     {(connectedWallets.length > 0) ? <>
            //         <Header as='h3'>Your active wallet connections</Header>
            //         <Comment.Group>
            //             {connectedWallets.map((x, i) => (
            //                 <div key={i} style={{ marginBottom: '10px', display: 'flex', boxShadow: '0 0 0 1px rgba(34,36,38,.15) inset', borderRadius: '.28571429rem', padding: '.78571429em 1.5em .78571429em' }}>
            //                     {(x.account) ? <img src={makeBlockie(x.account)} style={{ width: '38px', height: '38px', borderRadius: '4px', margin: '2px 0' }} /> : null}
            //                     <div style={{ flex: 'auto', marginLeft: '10px' }}>
            //                         <div style={{ display: 'inline', color: 'rgba(0,0,0,.4)' }}>
            //                             {/* {(x.default) ? <Icon name='star' /> : <Icon link name='star outline' onClick={() => this.setWalletFor(x.type)} />} */}
            //                             {(x.account) ? <span title={x.account} style={{ color: '#000', fontWeight: 'bold' }}>{(x.account.indexOf('0x') !== -1) ? x.account.substr(0, 6) + '...' + x.account.substr(38) : x.account}</span> : null}
            //                             <CheckIcon text='Copied' name='copy' style={{ marginLeft: '4px' }} onClick={() => navigator.clipboard.writeText(x.account)} />
            //                         </div>
            //                         {/* <Comment.Author style={{ display: 'inline' }}>{x.account}</Comment.Author> */}
            //                         {/* <Icon link name='external' onClick={() => window.open(`https://${(x.chainId === 1) ? '' : networkName(x.chainId) + '.'}etherscan.io/address/${x.account}`, '_blank')} /> */}
            //                         <div>
            //                             {walletIcons[x.type] ? <img style={{ width: '16px', position: 'relative', top: '3px' }} src={walletIcons[x.type]} /> : null}
            //                             {x.meta?.icon ? <img style={{ width: '16px', position: 'relative', top: '3px', marginLeft: '3px' }} src={x.meta.icon} /> : null}
            //                             {(x.lastUsage) ? <span style={{ marginLeft: '6px', color: 'rgba(0,0,0,.4)' }}><ReactTimeAgo date={new Date(x.lastUsage)} locale="en-US" /></span> : null}
            //                             {/* <span style={{ marginLeft: '0.5em' }}>{networkName(x.chainId)}</span> */}
            //                         </div>
            //                         {/* <Comment.Actions>
            //                             <Comment.Action onClick={() => this.disconnectButtonClick(x.type)}>Disconnect</Comment.Action>
            //                         </Comment.Actions> */}
            //                     </div>
            //                     <div>
            //                         <Button onClick={() => this.disconnectButtonClick(x.chain, x.type)} size='tiny' style={{ margin: '5px 0' }}>Disconnect</Button>
            //                     </div>
            //                 </div>
            //             ))}
            //         </Comment.Group>
            //     </> : null}

            //     {(disconnectedWallets.length > 0) ? <>
            //         <Header as='h3'>Connect a new wallet</Header>

            //         {(!this.state.descriptors.find(x => x.type === WalletTypes.METAMASK).connected && (p.chains.length === 0 || p.chains.includes(ChainTypes.ETHEREUM_GOERLI))) ?
            //             (this.state.descriptors.find(x => x.type === WalletTypes.METAMASK).available) ?
            //                 <Button
            //                     // disabled={this.state.descriptors.find(x => x.type === 'metamask').available === false}
            //                     basic
            //                     fluid
            //                     size='large'
            //                     onClick={() => window.location.hash = '/pairing/metamask'}
            //                     style={{ height: '64px', marginBottom: '10px' }}
            //                 >
            //                     <Image size='mini' verticalAlign='middle' src={logos.metamask} />{' '}
            //                     <span>MetaMask</span>
            //                 </Button> :
            //                 <Button
            //                     // disabled={this.state.descriptors.find(x => x.type === 'metamask').available === false}
            //                     basic
            //                     fluid
            //                     size='large'
            //                     onClick={() => this._openMetamaskWebpage()}
            //                     style={{ height: '64px', marginBottom: '10px' }}
            //                 >
            //                     <Image size='mini' verticalAlign='middle' src={logos.metamask} />{' '}
            //                     <span>Install MetaMask</span>
            //                 </Button> :
            //             null}

            //         {(!this.state.descriptors.find(x => x.type === WalletTypes.WALLETCONNECT).connected && (p.chains.length === 0 || p.chains.includes(ChainTypes.ETHEREUM_GOERLI))) ?
            //             <Button
            //                 // disabled={this.state.descriptors.find(x => x.type === 'walletconnect').available === false}
            //                 basic
            //                 fluid
            //                 size='large'
            //                 onClick={() => window.location.hash = '/pairing/walletconnect'}
            //                 style={{ height: '64px', marginBottom: '10px' }}
            //             >
            //                 <Image size='mini' verticalAlign='middle' src={logos.walletconnect} />{' '}
            //                 <span>WalletConnect</span>
            //             </Button> :
            //             null}
                        
            //         {(!this.state.descriptors.find(x => x.type === WalletTypes.NEAR && x.chain === ChainTypes.NEAR_TESTNET).connected && (p.chains.length === 0 || p.chains.includes(ChainTypes.NEAR_TESTNET))) ?
            //             <Button
            //                 // disabled={this.state.descriptors.find(x => x.type === 'walletconnect').available === false}
            //                 basic
            //                 fluid
            //                 size='large'
            //                 onClick={() => window.location.hash = '/pairing/near_testnet'}
            //                 style={{ height: '64px', marginBottom: '10px' }}
            //             >
            //                 <Image size='mini' verticalAlign='middle' src={logos.near} style={{ padding: '4px' }} />{' '}
            //                 <span>NEAR Wallet (Testnet)</span>
            //             </Button> :
            //             null}
 
            //         {(!this.state.descriptors.find(x => x.type === WalletTypes.NEAR && x.chain === ChainTypes.NEAR_MAINNET).connected && (p.chains.length === 0 || p.chains.includes(ChainTypes.NEAR_MAINNET))) ?
            //             <Button
            //                 // disabled={this.state.descriptors.find(x => x.type === 'walletconnect').available === false}
            //                 basic
            //                 fluid
            //                 size='large'
            //                 onClick={() => window.location.hash = '/pairing/near_mainnet'}
            //                 style={{ height: '64px', marginBottom: '10px' }}
            //             >
            //                 <Image size='mini' verticalAlign='middle' src={logos.near} style={{ padding: '4px' }} />{' '}
            //                 <span>NEAR Wallet (Mainnet)</span>
            //             </Button> :
            //             null}
                    
            //         {(!this.state.descriptors.find(x => x.type === WalletTypes.DAPPLETS).connected && (p.chains.length === 0 || p.chains.includes(ChainTypes.ETHEREUM_GOERLI))) ?
            //             <Button
            //                 // disabled={this.state.descriptors.find(x => x.type === 'walletconnect').available === false}
            //                 basic
            //                 fluid
            //                 size='large'
            //                 onClick={() => window.location.hash = '/pairing/dapplets'}
            //                 style={{ height: '64px', marginBottom: '10px' }}
            //             >
            //                 <Image size='mini' verticalAlign='middle' src={logos.dapplets} style={{ padding: '4px' }} />{' '}
            //                 <span>Built-in Test Only Wallet</span>
            //             </Button> :
            //             null}

            //     </> : null}
            // </>
        );
    }
}