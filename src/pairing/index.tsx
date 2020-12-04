import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import 'semantic-ui-css/semantic.min.css'
import { SelectWallet } from "./components/selectWallet";
import './index.scss';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { HashRouter, Route, Link, Redirect, Switch } from "react-router-dom";
import WalletConnect from "./modules/walletconnect";
import { browser } from "webextension-polyfill-ts";
import * as logger from '../common/logger';
import { Bus } from '../common/bus';
import * as modules from './modules';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

TimeAgo.addDefaultLocale(en);
window.onerror = logger.log;

interface Props {
}

interface State {
}

class Index extends React.Component<Props, State> {
    private bus: Bus = new Bus();

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <HashRouter>
                <Switch>
                    <Route exact path="/" component={SelectWallet} />
                    <Route path="/metamask" component={() => <modules.metamask bus={this.bus} />} />
                    <Route path="/walletconnect" component={() => <modules.walletconnect bus={this.bus} />} />
                </Switch>
            </HashRouter>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));