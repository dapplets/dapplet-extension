import { JsonRpc } from "../common/jsonrpc";
import { WalletDescriptor } from "../common/types";
import { GlobalEventBus } from "./globalEventBus";

type Account = {
    chain: string;
    chainId: number;
    account: string;
}

type TrustedUser = {
    account: string;
}

type Dapplet = {
    registry: string;
    moduleName: string;
}

export class DappletsProvider {

    constructor(private _rpc: JsonRpc, private _globalEventBus: GlobalEventBus) { }

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

    async getTrustedUsers(): Promise<TrustedUser[]> {
        return this._rpc.call('callBackground', ['getTrustedUsers', []], window);
    }

    async addTrustedUser(account: string): Promise<void> {
        return this._rpc.call('callBackground', ['addTrustedUser', [account]], window);
    }

    async removeTrustedUser(account: string): Promise<void> {
        return this._rpc.call('callBackground', ['removeTrustedUser', [account]], window);
    }

    onTrustedUsersChanged(callback: () => void): void {
        this._globalEventBus.on('trustedusers_changed', callback);
    }

    getMyDapplets(): Promise<Dapplet[]> {
        return this._rpc.call('callBackground', ['getMyDapplets', []], window);
    }

    addMyDapplet(registryUrl: string, moduleName: string): Promise<void> {
        return this._rpc.call('callBackground', ['addMyDapplet', [registryUrl, moduleName]], window);
    }

    removeMyDapplet(registryUrl: string, moduleName: string): Promise<void> {
        return this._rpc.call('callBackground', ['removeMyDapplet', [registryUrl, moduleName]], window);
    }

    onMyDappletsChanged(callback: () => void): void {
        this._globalEventBus.on('mydapplets_changed', callback);
    }

    // onUninstall(callback: () => void): void {

    // }

    openDeployOverlay(registryUrl: string, name: string, branch: string | null = null, version: string | null = null) {
        return this._rpc.call('callBackground', ['openDeployOverlayById', [registryUrl, name, branch, version]]);
    }
}