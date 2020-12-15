import * as React from "react";
import { WalletDescriptor } from "../../background/services/walletService";
import { Bus } from "../../common/bus";
import { Account } from "../../background/services/identityService";
import { Login } from './Login';
import { SelectWallet } from './SelectWallet';

interface Props {
    account?: {
        username: string;
        fullname: string;
        img: string;
        domainId: number;
    };
    app: string;
    bus: Bus;
}

interface State {
    loading: boolean;
    descriptors: (WalletDescriptor & { relatedIdentities: Account[] })[];
}

export class App extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            descriptors: []
        }
    }

    render() {
        const p = this.props;

        if (p.account) {
            return <Login bus={p.bus} account={p.account} app={p.app} />;
        } else {
            return <SelectWallet bus={p.bus} app={p.app} />;
        }
    }
}