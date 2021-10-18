import { JsonRpc } from "../common/jsonrpc";
import { WalletDescriptor } from "../common/types";


type Account = {
    chain: string;
    chainId: number;
    account: string;
}

export class DappletsProvider {

    constructor(private _rpc: JsonRpc) { }

    async getAccounts(): Promise<Account[]> {
        const descriptors: WalletDescriptor[] = await this._rpc.call('getWalletDescriptors', [], window);
        return descriptors.filter(x => x.available && x.connected)
            .map(x => ({
                chain: x.chain,
                chainId: x.chainId,
                account: x.account
            }));
    }

    async connectWallet(): Promise<void> {
        return this._rpc.call('pairWalletViaOverlay', [], window);
    }

    async openOverlay(): Promise<void> {
        return this._rpc.call('openOverlay', [], window);
    }

    async closeOverlay(): Promise<void> {
        return this._rpc.call('closeOverlay', [], window);
    }

    async toggleOverlay(): Promise<void> {
        return this._rpc.call('toggleOverlay', [], window);
    }

}