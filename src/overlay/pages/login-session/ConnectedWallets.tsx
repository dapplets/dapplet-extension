import * as React from "react";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import makeBlockie from 'ethereum-blockies-base64';
import cn from 'classnames';
import { Redirect } from 'react-router-dom';

import * as walletIcons from '../../../common/resources/wallets';
import { Bus } from "../../../common/bus";
import { LoginRequest, WalletDescriptor } from "../../../common/types";
import { Session } from "../../components/Session";
import { Button } from "../../components/Button";
import base from '../../components/Base.module.scss';

interface Props {
    data: {
        frameId: string;
        app: string;
        loginRequest: LoginRequest;
    }
    bus: Bus;
}

interface State {
    loading: boolean;
    descriptors: WalletDescriptor[];
    redirect: string | null;
}

export class ConnectedWallets extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            descriptors: [],
            redirect: null
        }
    }

    async componentDidMount() {
        await this.loadData();
    }

    async loadData() {
        const { getWalletDescriptors } = await initBGFunctions(browser);
        const descriptors = await getWalletDescriptors();

        this.setState({
            descriptors,
            loading: false
        });
    }

    async selectWallet(wallet: string, chain: string) {
        const frameId = this.props.data.frameId;
        this.props.bus.publish('ready', [frameId, { wallet, chain }]);
        await this.componentDidMount();
    }

    async pairWallet() {
        const chains = this.props.data.loginRequest.authMethods;
        const { pairWalletViaOverlay } = await initBGFunctions(browser);
        await pairWalletViaOverlay(chains);
        await this.loadData();
    }

    render() {
        const p = this.props,
              s = this.state;
            
        const chains = this.props.data.loginRequest.authMethods;

        if (s.redirect) {
            return <Redirect to={s.redirect} />;
        }

        if (s.loading) return null;

        const connectedWallets = s.descriptors.filter(x => x.connected).filter(x => x.chain ? chains.includes(x.chain) : true);
        const disconnectedWallets = s.descriptors.filter(x => !x.connected).filter(x => x.chain ? chains.includes(x.chain) : true);

        return (
            <div className={base.wrapper}>
				<h2 className={base.title}>Active sessions</h2>
				<p className={base.subtitle}>Reuse active login</p>

				<ul className={base.list}>
                    {connectedWallets.map((x, i) => (
                        <li className={base.item} key={i}>
                            <Session 
                                key={i}
                                providerIcon={walletIcons[x.type] ? walletIcons[x.type] : null}
                                lastUsage={x.lastUsage}
                                walletIcon={x.meta?.icon ? x.meta.icon : null}
                                account={(x.account.indexOf('0x') !== -1) ? x.account.substring(0, 6) + '...' + x.account.substring(38) : x.account}
                                accountIcon={x.account ? makeBlockie(x.account) : null}
                                buttons={<Button onClick={() => this.selectWallet(x.type, x.chain)}>Select</Button>}
                            />
                        </li>
                    ))}
				</ul>

				{(disconnectedWallets.length > 0) ? <button 
                    className={cn(base.createSession, base.link)}
                    onClick={() => this.setState({ redirect: '/pairing' })}
                >Create new session</button> : null}
			</div>
        );
    }
}