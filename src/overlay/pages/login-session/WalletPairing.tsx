import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { Redirect } from 'react-router-dom';

// import * as logos from '../../../common/resources/wallets';
import { Bus } from "../../../common/bus";
import { ChainTypes, WalletDescriptor, WalletTypes } from "../../../common/types";
import { ConnectWallet } from './ConnectWallet';

import DappletsLogo from '../../assests/dapplets.svg';
import MetaMaskLogo from '../../assests/metamask.svg';
import WalletConnectLogo from '../../assests/walletconnect.svg';
import NearMainnetLogo from '../../assests/near_mainnet.svg';
import NearTestnetLogo from '../../assests/near_testnet.svg';

interface IWalletPairingProps {
    bus: Bus;
    chains: ChainTypes[];
}

interface IWalletPairingState {
    loading: boolean;
    descriptors: WalletDescriptor[];
    redirect: string | null;
}

export class WalletPairing extends React.Component<IWalletPairingProps, IWalletPairingState> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            descriptors: [],
            redirect: null
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
                icon: MetaMaskLogo
            }
        } else if (wallet === WalletTypes.WALLETCONNECT) {
            return {
                id: 'walletconnect',
                label: 'WalletConnect',
                icon: WalletConnectLogo
            }
        } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_TESTNET) {
            return {
                id: 'near_testnet',
                label: 'NEAR Wallet (Testnet)',
                icon: NearTestnetLogo
            }
        } else if (wallet === WalletTypes.NEAR && chain === ChainTypes.NEAR_MAINNET) {
            return {
                id: 'near_mainnet',
                label: 'NEAR Wallet (Mainnet)',
                icon: NearMainnetLogo
            }
        } else if (wallet === WalletTypes.DAPPLETS) {
            return {
                id: 'dapplets',
                label: 'Built-in Test Only Wallet',
                icon: DappletsLogo
            }
        }
    }

    render() {
        const p = this.props;

        if (this.state.redirect) {
            return <Redirect to={this.state.redirect} />
        }

        if (this.state.loading) return null;

        // const connectedWallets = this.state.descriptors
        //     .filter(x => x.connected)
        //     .filter(x => p.chains.length > 0 ? p.chains.includes(x.chain) : true);

        const disconnectedWallets = this.state.descriptors
            .filter(x => !x.connected)
            .filter(x => p.chains.length > 0 ? p.chains.includes(x.chain) : true);


        const wallets = disconnectedWallets.map(x => this.getMeta(x.type, x.chain));

        return (
            <ConnectWallet 
                onWalletClick={(id) => this.setState({ redirect: '/pairing/' + id })}
                wallets={wallets}
            />
        );
    }
}