import * as React from "react";
import { Bus } from "../../../common/bus";
import { ConnectedWallets } from './ConnectedWallets';
import { ChainTypes, LoginRequest } from "../../../common/types";
import { HashRouter, MemoryRouter, Route, Switch, Redirect } from "react-router-dom";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { WalletPairing } from './WalletPairing';
import MetaMask from './wallets/MetaMask';
import WalletConnect from './wallets/WalletConnect';
import Near from './wallets/Near';
import Dapplets from './wallets/Dapplets';

interface Props {
    request: {
        frameId: string;
        app: string;
        loginRequest: LoginRequest;
    };
    bus: Bus;
}

interface State {
    redirect: string | null;
}

export class LoginSession extends React.Component<Props, State> {

    constructor(p: Props) {
        super(p);
        this.state = {
            redirect: null
        }
        this.routePages();
    }

    async routePages() {
        const chains = this.props.request.loginRequest.authMethods;

        const { getWalletDescriptors } = await initBGFunctions(browser);
        const descriptors = await getWalletDescriptors();

        const connectedWallets = descriptors
            .filter(x => x.connected)
            .filter(x => chains.length > 0 ? chains.includes(x.chain) : true);

        if (connectedWallets.length > 0) {
            this.setState({ redirect: '/connected-wallets' });
        } else {
            this.setState({ redirect: '/pairing' });
        }
    }

    render() {
        const p = this.props;
        const s = this.state;
        const chains = this.props.request.loginRequest.authMethods;

        return (
            <MemoryRouter>
                <Switch>
                    <Route exact path="/connected-wallets" component={() => <ConnectedWallets bus={p.bus} data={p.request} />} />
                    <Route exact path="/pairing" component={() => <WalletPairing bus={p.bus} chains={chains as ChainTypes[]} />} />
                    <Route path="/pairing/metamask" component={() => <MetaMask bus={p.bus} frameId={p.request.frameId} />} />
                    <Route path="/pairing/walletconnect" component={() => <WalletConnect bus={p.bus} frameId={p.request.frameId} />} />
                    <Route path="/pairing/near_testnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_TESTNET} frameId={p.request.frameId} />} />
                    <Route path="/pairing/near_mainnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_MAINNET} frameId={p.request.frameId} />} />
                    <Route path="/pairing/dapplets" component={() => <Dapplets bus={p.bus} frameId={p.request.frameId} />} />

                    {(s?.redirect) ? <Redirect to={s.redirect} /> : null}
                </Switch>
            </MemoryRouter>
        );
    }
}