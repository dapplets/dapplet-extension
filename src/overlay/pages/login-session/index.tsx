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
import { LoginConfirmations } from "./LoginConfirmations";

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
        const loginRequest = this.props.request.loginRequest;
        const chains = loginRequest.authMethods;
        const secureLogin = loginRequest.secureLogin;

        const { getWalletDescriptors, getSuitableLoginConfirmations } = await initBGFunctions(browser);

        const descriptors = await getWalletDescriptors();

        const connectedWallets = descriptors
            .filter(x => x.connected)
            .filter(x => chains.length > 0 ? chains.includes(x.chain) : true);

        if (secureLogin === 'required') { // ToDo: handle optional mode
            const confirmations = await getSuitableLoginConfirmations(this.props.request.app, loginRequest);

            const validConfirmations = confirmations.filter(x => !!connectedWallets.find(y => y.chain === x.authMethod && y.type === x.wallet));
            
            if (validConfirmations.length > 0) {
                this.setState({ redirect: '/login-confirmations' });
                return;
            }
        }

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
                    <Route exact path="/login-confirmations" component={() => <LoginConfirmations bus={p.bus} data={p.request} />} />
                    <Route exact path="/connected-wallets" component={() => <ConnectedWallets bus={p.bus} data={p.request} />} />
                    <Route exact path="/pairing" component={() => <WalletPairing bus={p.bus} chains={chains as ChainTypes[]} data={p.request} />} />
                    <Route path="/pairing/metamask" component={() => <MetaMask bus={p.bus} frameId={p.request.frameId} data={p.request}  />} />
                    <Route path="/pairing/walletconnect" component={() => <WalletConnect bus={p.bus} frameId={p.request.frameId} data={p.request} />} />
                    <Route path="/pairing/near_testnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_TESTNET} frameId={p.request.frameId} data={p.request} />} />
                    <Route path="/pairing/near_mainnet" component={() => <Near bus={p.bus} chain={ChainTypes.NEAR_MAINNET} frameId={p.request.frameId} data={p.request} />} />
                    <Route path="/pairing/dapplets" component={() => <Dapplets bus={p.bus} frameId={p.request.frameId} data={p.request} />} />

                    {(s?.redirect) ? <Redirect to={s.redirect} /> : null}
                </Switch>
            </MemoryRouter>
        );
    }
}