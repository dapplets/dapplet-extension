import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { List, Button, Segment } from "semantic-ui-react";
import { Container, Header } from 'semantic-ui-react'
import { svgObject } from "qr-image";
import { Link, Redirect } from "react-router-dom";
import { Bus } from '../../common/bus';
import { WalletInfo } from '../../common/constants';

interface Props {
    bus: Bus;
}

interface State {
    error: string;
    connected: boolean;
}

export default class extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            connected: false
        };
    }

    async componentDidMount() {
        try {
            const { connectWallet } = await initBGFunctions(browser);
            await connectWallet('metamask');
            this.setState({ connected: true });
        } catch (err) {
            console.log(err);
            this.setState({ error: 'Error ' });
        }
    }

    render() {
        if (this.state.error) return (<div>{this.state.error}</div>);
        if (!this.state.connected) return (<div>Metamask is connecting</div>);
        if (this.state.connected) return (<div>Metamask is connected</div>);
    }
}
