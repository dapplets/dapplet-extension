import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Container, Header, Button, Image } from 'semantic-ui-react'
import { Link } from "react-router-dom";
import * as logos from '../../common/resources/wallets';
import { WalletDescriptor } from "../../background/services/walletService";

interface ISelectWalletProps {
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

    render() {
        if (this.state.loading) return null;

        return (
            <Container text>
                <Header as='h2'>Connect a Wallet</Header>
                <p>Get started by connecting one of the wallets bellow</p>

                <Button
                    disabled={this.state.descriptors.find(x => x.type === 'metamask').connected}
                    basic
                    fluid
                    size='large'
                    onClick={() => window.location.hash = '/metamask'}
                    style={{ height: '64px', marginBottom: '10px' }}
                >
                    <Image size='mini' verticalAlign='middle' src={logos.metamask} />{' '}
                    <span>MetaMask</span>
                </Button>

                <Button
                    disabled={this.state.descriptors.find(x => x.type === 'walletconnect').connected}
                    basic
                    fluid
                    size='large'
                    onClick={() => window.location.hash = '/walletconnect'}
                    style={{ height: '64px', marginBottom: '10px' }}
                >
                    <Image size='mini' verticalAlign='middle' src={logos.walletconnect} />{' '}
                    <span>WalletConnect</span>
                </Button>
            </Container>
        );
    }
}