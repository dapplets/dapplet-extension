import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';

import { List, Button, Segment } from "semantic-ui-react";
import { Container, Header } from 'semantic-ui-react'
import { svgObject } from "qr-image";
import { Link } from "react-router-dom";
import { Bus } from '../bus';

interface ISelectWalletProps {
}

interface ISelectWalletState {
    svgPath: string;
    isPaired: boolean;
    error: string;
    wallet?: {
        accounts?: string[],
        chainId?: number,
        peerId?: string,
        peerMeta?: {
            icons?: string[],
            name?: string,
            url?: string
        }
    }
}

export class WalletConnectPairing extends React.Component<ISelectWalletProps, ISelectWalletState> {
    private bus: Bus = null;

    constructor(props) {
        super(props);
        this.bus = new Bus();
        this.state = {
            svgPath: null,
            isPaired: false,
            error: null
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(extension);
        const { generateUri, waitPairing } = backgroundFunctions;
        var uri = await generateUri();
        console.log("New pairing URI generated", uri);
        const svgPath = svgObject(uri, { type: 'svg' });
        this.setState({ svgPath: svgPath.path });

        const result = await waitPairing();

        if (result) {
            const wallet = result.params[0];
            if (wallet) {
                this.setState({ wallet });
                console.log({ wallet });
            }

            this.setState({
                isPaired: true
            });
            this.bus.publish('paired');
        } else {
            this.setState({
                isPaired: true,
                error: 'Wallet paring failed'
            });
            this.bus.publish('error');
        }

    }

    render() {
        const { svgPath, isPaired, error, wallet } = this.state;

        return (
            <Container text>
                {!isPaired ? (
                    <React.Fragment>
                        <Header as='h2'>WalletConnect Pairing</Header>
                        <p>Scan QR code with a WalletConnect-compatible wallet</p>
                        {svgPath ? (<svg viewBox="1 1 53 53"><path d={svgPath} /></svg>) : null}
                        <Button><Link to="/">Back</Link></Button>
                    </React.Fragment>
                ) : (
                        <React.Fragment>
                            {!error ? (
                                <div>
                                    <Header as='h2'>Wallet connected</Header>
                                    <p>Account: {wallet.accounts[0]}</p>
                                    <p>Chain ID: {wallet.chainId}</p>
                                    <p>Peer ID: {wallet.peerId}</p>
                                    <p>Peer Name: {wallet.peerMeta && wallet.peerMeta.name}</p>
                                    <p>Peer URL: {wallet.peerMeta && wallet.peerMeta.url}</p>
                                </div>
                            ) : (<p>{error}</p>)}
                        </React.Fragment>
                    )}
            </Container>
        );
    }
}
