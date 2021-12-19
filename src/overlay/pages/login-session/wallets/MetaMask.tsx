import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Button, Segment, Loader } from "semantic-ui-react";
import { Redirect } from "react-router-dom";
import { Bus } from '../../../../common/bus';
import { ChainTypes, WalletDescriptor, WalletTypes } from "../../../../common/types";
import { Loading } from "../../../components/Loading";

interface Props {
    bus: Bus;
}

interface State {
    error: string;
    connected: boolean;
    toBack: boolean;
    descriptor: WalletDescriptor | null;
}

export default class extends React.Component<Props, State> {

    private _mounted = false;

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            connected: false,
            toBack: false,
            descriptor: null
        };
    }

    async componentDidMount() {
        this._mounted = true;

        try {
            const { connectWallet, getWalletDescriptors } = await initBGFunctions(browser);
            await connectWallet(ChainTypes.ETHEREUM_GOERLI, WalletTypes.METAMASK, null);
            const descriptors = await getWalletDescriptors();
            const descriptor = descriptors.find(x => x.type === WalletTypes.METAMASK);
            
            if (this._mounted) {
                this.setState({ connected: true, descriptor });
                this.continue();
            }
        } catch (err) {
            if (this._mounted) {
                this.setState({ connected: true, error: err.message });
            }
        }
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    // async disconnect() {
    //     const { disconnectWallet } = await initBGFunctions(browser);
    //     await disconnectWallet(ChainTypes.ETHEREUM_GOERLI, WalletTypes.METAMASK);
    //     this.setState({ toBack: true });
    // }

    async continue() {
        this.props.bus.publish('ready', { 
            wallet: WalletTypes.METAMASK,
            chain: ChainTypes.ETHEREUM_GOERLI
        });
    }

    render() {
        const s = this.state;

        if (s.toBack === true) {
            return <Redirect to='/pairing' />
        }

        if (s.error) return (
            <>
                <h3>Error</h3>
                <p>{s.error}</p>
                <Button onClick={() => this.setState({ toBack: true })}>Back</Button>
            </>
        );

        if (!s.connected) return (
            <Loading
                title="MetaMask" 
                subtitle="Please unlock your wallet to continue" 
                onBackButtonClick={() => this.setState({ toBack: true })}
            />
        );

        // if (s.connected) return (<>
        //     <h3>Connected</h3>
        //     <p>The wallet is connected</p>
        //     {(s.descriptor.meta) ? <Segment style={{ textAlign: 'center' }}>
        //         <img src={s.descriptor.meta.icon} alt={s.descriptor.meta.name} style={{ width: '64px' }} />
        //         <div style={{ fontWeight: 'bold', fontSize: '1.3em' }}>{s.descriptor.meta.name}</div>
        //         <div>{s.descriptor.meta.description}</div>
        //         <div>{s.descriptor.account}</div>
        //     </Segment> : null}
        //     <div style={{ marginTop: '15px' }}>
        //         <Button onClick={() => this.disconnect()}>Disconnect</Button>
        //         <Button primary onClick={() => this.continue()}>Continue</Button>
        //     </div>
        // </>);

        return null;
    }
}
