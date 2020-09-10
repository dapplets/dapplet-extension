import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css'
import { SelectWallet } from "./components/selectWallet";
import './index.scss';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { HashRouter, Route, Link, Redirect, Switch } from "react-router-dom";
import { WalletConnectPairing } from "./components/walletConnectPairing";
import { browser } from "webextension-polyfill-ts";
import * as logger from '../common/logger';

window.onerror = logger.log;

interface IIndexProps {
}

interface IIndexState {
    isConnected: boolean
}

class Index extends React.Component<IIndexProps, IIndexState> {
    constructor(props) {
        super(props);

        this.state = {
            isConnected: false
        };
    }

    async componentDidMount() {
        var backgroundFunctions = await initBGFunctions(browser);
        const { checkConnection } = backgroundFunctions;

        var isConnected = await checkConnection();

        this.setState({
            isConnected
        });
    }

    render() {
        const { isConnected } = this.state;

        return (
            <HashRouter>
                {isConnected ? "Wallet connected already" : (
                    <Switch>
                        <Route exact path="/" component={SelectWallet} />
                        <Route path="/walletconnect" component={WalletConnectPairing} />
                    </Switch>
                )}
            </HashRouter>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));