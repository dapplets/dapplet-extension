import * as React from "react";
import { Bus } from "../../../common/bus";
import { Account } from "../../../background/services/identityService";
import { SelectWallet } from './SelectWallet';
import { ChainTypes, WalletDescriptor } from "../../../common/types";

interface Props {
    data: {
        app: string;
        chains: ChainTypes[];
    };
    bus: Bus;
}

interface State {}

export class LoginSession extends React.Component<Props, State> {
    render() {
        const p = this.props;

        return <SelectWallet bus={p.bus} data={p.data} />;
    }
}