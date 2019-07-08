import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";

import { List, Button, Segment } from "semantic-ui-react";
import { Container, Header } from 'semantic-ui-react'
import { svgObject } from "qr-image";
import { Link } from "react-router-dom";

interface ISelectWalletProps {
}

interface ISelectWalletState {
    svgPath: string;
    isPairing: boolean;
    error: string;
}

export class WalletConnectPairing extends React.Component<ISelectWalletProps, ISelectWalletState> {
    constructor(props) {
        super(props);

        this.state = {
            svgPath: null,
            isPairing: true,
            error: null
        };
    }

    async componentDidMount() {
        const backgroundFunctions = await initBGFunctions(chrome);
        const { generateUri, waitPairing } = backgroundFunctions;
        var uri = await generateUri();
        const svgPath = svgObject(uri, { type: 'svg' });
        console.log({svgPath});
        this.setState({ svgPath: svgPath.path });

        const result = await waitPairing();

        if (result) {
            this.setState({
                isPairing: false
            });
        } else {
            this.setState({
                isPairing: false,
                error: 'Wallet paring failed'
            });
        }
    }

    render() {
        const { svgPath, isPairing, error } = this.state;

        return (
            <Container text>
                <Header as='h2'>WalletConnect Pairing</Header>
                {isPairing ? (
                    <React.Fragment>
                        <p>Scan QR code with a WalletConnect-compatible wallet</p>
                        {svgPath ? (<svg viewBox="1 1 54 54"><path d={svgPath}/></svg>) : null}
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <p>{error}</p>
                    </React.Fragment>
                )}
            </Container>
        );
    }
}
