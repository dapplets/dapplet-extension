import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import { List, Button, Segment } from "semantic-ui-react";
import { Container, Header } from 'semantic-ui-react'
import { Link } from "react-router-dom";

interface ISelectWalletProps {
}

interface ISelectWalletState {

}

export class SelectWallet extends React.Component<ISelectWalletProps, ISelectWalletState> {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <Container text>
                <Header as='h2'>Connect a Wallet</Header>
                <p>Get started by connecting one of the wallets bellow</p>
                <div>
                    <Button basic><Link to="/walletconnect">WalletConnect</Link></Button>
                </div>
            </Container>
        );
    }
}