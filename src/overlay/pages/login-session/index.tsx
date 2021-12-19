import * as React from "react";
import { Bus } from "../../../common/bus";
import { ConnectedWallets } from './ConnectedWallets';
import { ChainTypes, LoginRequest } from "../../../common/types";
import { HashRouter, Route, Switch } from "react-router-dom";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { WalletPairing } from './WalletPairing';
import MetaMask from './wallets/MetaMask';
import WalletConnect from './wallets/WalletConnect';
import Near from './wallets/Near';
import Dapplets from './wallets/Dapplets';

interface Props {
    data: {
        app: string;
        loginRequest: LoginRequest;
    };
    bus: Bus;
}

interface State {

}

export class LoginSession extends React.Component<Props, State> {

    constructor(p: Props) {
        super(p);
        this.routePages();
    }

    async routePages() {
        const chains = this.props.data.loginRequest.authMethods;

        const { getWalletDescriptors } = await initBGFunctions(browser);
        const descriptors = await getWalletDescriptors();

        const connectedWallets = descriptors
            .filter(x => x.connected)
            .filter(x => chains.length > 0 ? chains.includes(x.chain) : true);

        if (connectedWallets.length > 0) {
            window.location.hash = '/connected-wallets';
        } else {
            window.location.hash = '/pairing';
        }
    }

    render() {
        const p = this.props;
        const chains = this.props.data.loginRequest.authMethods;

        return (
            <HashRouter>
                <Switch>
                    <Route exact path="/connected-wallets" component={() => <ConnectedWallets bus={p.bus} data={p.data} />} />
                    <Route exact path="/pairing" component={() => <WalletPairing bus={p.bus} chains={chains as ChainTypes[]} />} />
                    <Route path="/pairing/metamask" component={() => <MetaMask bus={p.bus} />} />
                    <Route path="/pairing/walletconnect" component={() => <WalletConnect bus={p.bus} />} />
                    <Route path="/pairing/near_testnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_TESTNET} />} />
                    <Route path="/pairing/near_mainnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_MAINNET} />} />
                    <Route path="/pairing/dapplets" component={() => <Dapplets bus={p.bus} />} />
                </Switch>
            </HashRouter>
        );
    }
}