import { providers, Signer, utils } from 'ethers';
import { browser } from 'webextension-polyfill-ts';
import { getCurrentTab } from '../../common/helpers';
import wallets from '../wallets';
import GlobalConfigService from './globalConfigService';
import { GenericWallet } from '../wallets/interface';
import { EthereumWallet } from '../wallets/ethereum/interface';
import { NearWallet } from '../wallets/near/interface';
import { ChainTypes, DefaultSigners, WalletDescriptor, WalletTypes } from '../../common/types';

export class WalletService {

    private _map: { [chain: string]: { [wallet: string]: GenericWallet } } = {};

    constructor(private _globalConfigService: GlobalConfigService) {
        for (const chain in wallets) {
            this._map[chain] = {};
            for (const wallet in wallets[chain]) {
                this._map[chain][wallet] = new wallets[chain][wallet]();
            }
        }
    }

    async connectWallet(wallet: WalletTypes) {
        // ToDo: is need chain argument?
        const chain = this._getWalletsArray().find(x => x.wallet === wallet).chain;
        return this._map[chain][wallet].connectWallet();
    }

    async disconnectWallet(wallet: WalletTypes) {
        // ToDo: is need chain argument?
        const chain = this._getWalletsArray().find(x => x.wallet === wallet).chain;
        await this._map[chain][wallet].disconnectWallet();

        const usage = await this._globalConfigService.getWalletsUsage();

        for (const app in usage) {
            if (usage?.[app]?.[chain] === wallet) {
                delete usage[app][chain];
            }
        }

        await this._globalConfigService.setWalletsUsage(usage);
    }

    async getWalletDescriptors(): Promise<WalletDescriptor[]> {
        const defaults = await this._getWalletFor(DefaultSigners.EXTENSION);
        const usage = await this._globalConfigService.getWalletsUsage();
        const arr = this._getWalletsArray();

        const getUsageApps = (chain: ChainTypes, wallet: WalletTypes) => {
            const arr: string[] = [];
            for (const app in usage) {
                if (usage[app]?.[chain] === wallet) {
                    arr.push(app);
                }
            }
            return arr;
        };

        return Promise.all(arr.map(async (w) => ({
            chain: w.chain,
            type: w.wallet,
            meta: await w.instance.getMeta(),
            connected: w.instance.isConnected(),
            available: w.instance.isAvailable(),
            account: await w.instance.getAddress(),
            chainId: await w.instance.getChainId(),
            apps: getUsageApps(w.chain, w.wallet),
            default: w.wallet === defaults[w.chain],
            lastUsage: w.instance.getLastUsage()
        })));
    }

    async eth_getSignerFor(app: string | DefaultSigners): Promise<Signer> {
        const me = this;
        return new (class extends Signer {
            provider = new providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/e2b99cd257a5468d94749fa32f75fc3c', 4);

            async getAddress(): Promise<string> {
                return '0x0000000000000000000000000000000000000000';
            }

            async signMessage(message: string | utils.Bytes): Promise<string> {
                throw new Error('Method not implemented.');
            }

            async signTransaction(transaction: utils.Deferrable<providers.TransactionRequest>): Promise<string> {
                throw new Error('Method not implemented.');
            }

            async sendTransaction(transaction: providers.TransactionRequest): Promise<providers.TransactionResponse> {
                const signer = await me._getInternalSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet ?? await me._pairSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet;
                return signer.sendTransaction(transaction);
            }

            connect(provider: providers.Provider): Signer {
                throw new Error('Method not implemented.');
            }
        })();
    }

    public async setWalletFor(walletType: WalletTypes, app: string | DefaultSigners, chain: ChainTypes) {
        const wallets = await this._globalConfigService.getWalletsUsage();
        if (!wallets[app]) wallets[app] = {};
        wallets[app][chain] = walletType;
        await this._globalConfigService.setWalletsUsage(wallets);
    }

    public async unsetWalletFor(app: string | DefaultSigners, chain: ChainTypes) {
        const wallets = await this._globalConfigService.getWalletsUsage();
        if (!wallets[app]) return;
        delete wallets[app][chain];
        await this._globalConfigService.setWalletsUsage(wallets);
    }

    public async pairWalletViaOverlay(chain: ChainTypes): Promise<void> {
        const activeTab = await getCurrentTab();
        // ToDo: pass chain
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_PAIRING_OVERLAY",
            payload: {
                topic: 'pair',
                args: [chain]
            }
        });
        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    public async prepareWalletFor(app: string | DefaultSigners, chain: ChainTypes, cfg?: { username: string, domainId: number, fullname?: string, img?: string }) {
        const defaults = await this._getWalletFor(app);
        const defaultWallet = defaults[chain];

        if (!defaultWallet) {
            // is login required?
            if (cfg && cfg.username && cfg.domainId) {
                return this._loginViaOverlay(app, chain, cfg);
            } else {
                return this._selectWalletViaOverlay(app, chain);
            }
        }

        const pairedWallets = await this.getWalletDescriptors();
        const suitableWallet = pairedWallets.find(x => x.chain === chain && x.type === defaultWallet);

        if (!suitableWallet || !suitableWallet.connected) {
            // is login required?
            if (cfg && cfg.username && cfg.domainId) {
                return this._loginViaOverlay(app, chain, cfg);
            } else {
                return this._selectWalletViaOverlay(app, chain);
            }
        }
    }

    public async getAddress(app: string | DefaultSigners, chain: ChainTypes): Promise<string> {
        const wallet = await this._getInternalSignerFor(app, chain);
        return wallet?.getAddress() ?? '0x0000000000000000000000000000000000000000';
    }

    public async eth_sendTransactionOutHash(app: string | DefaultSigners, transaction: providers.TransactionRequest): Promise<string> {
        const wallet = await this._getInternalSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet ?? await this._pairSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet;
        return wallet.sendTransactionOutHash(transaction);
    }

    public async eth_sendCustomRequest(app: string | DefaultSigners, method: string, params: any[]): Promise<any> {
        const wallet = await this._getInternalSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet ?? await this._pairSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet;
        return wallet.sendCustomRequest(method, params);
    }

    public async eth_waitTransaction(app: string | DefaultSigners, txHash: string, confirmations?: number) {
        const wallet = await this._getInternalSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet ?? await this._pairSignerFor(app, ChainTypes.ETHEREUM) as EthereumWallet;
        // the wait of a transaction from another provider can be long
        while (true) {
            await new Promise((res) => setTimeout(res, 1000));
            const tx = await wallet.provider.getTransaction(txHash);
            if (tx) return tx.wait(confirmations);
        }
    }

    public async near_sendCustomRequest(app: string | DefaultSigners, method: string, params: any[]): Promise<any> {
        const wallet = await this._getInternalSignerFor(app, ChainTypes.NEAR, false) as NearWallet;
        return wallet.sendCustomRequest(method, params);
    }


    public async near_getAccount(app: string | DefaultSigners) {
        const wallet = await this._getInternalSignerFor(app, ChainTypes.NEAR, false) as NearWallet;
        return wallet.getAccount();
    }

    private async _getInternalSignerFor(app: string | DefaultSigners, chain: ChainTypes, isConnected: boolean = true): Promise<GenericWallet> {
        const defaults = await this._getWalletFor(app);
        const defaultWallet = defaults?.[chain];

        if (defaultWallet && this._map[chain][defaultWallet].isConnected()) return this._map[chain][defaultWallet];

        // ToDo: clean walletType?

        // choose first connected wallet
        for (const wallet in this._map[chain]) {
            if (this._map[chain][wallet].isConnected()) {
                return this._map[chain][wallet];
            }
        }

        if (!isConnected) {
            for (const wallet in this._map[chain]) {
                return this._map[chain][wallet];
            }
        }
    }

    private async _pairSignerFor(app: string | DefaultSigners, chain: ChainTypes): Promise<GenericWallet> {
        // pairing
        await this.pairWalletViaOverlay(chain);

        // choose first connected wallet
        for (const wallet in this._map[chain]) {
            if (this._map[chain][wallet].isConnected()) {
                return this._map[chain][wallet];
            }
        }

        throw new Error('Cannot find signer');
    }

    private _getWalletsArray() {
        const arr: { chain: ChainTypes, wallet: WalletTypes, instance: GenericWallet }[] = [];
        for (const chain in this._map) {
            for (const wallet in this._map[chain]) {
                arr.push({
                    chain: chain as ChainTypes,
                    wallet: wallet as WalletTypes,
                    instance: this._map[chain][wallet]
                })
            }
        }
        return arr;
    }

    private async _loginViaOverlay(app: string | DefaultSigners, chain: ChainTypes, cfg?: { username: string, domainId: number, fullname?: string, img?: string }): Promise<void> {
        const activeTab = await getCurrentTab();
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_LOGIN_OVERLAY",
            payload: {
                topic: 'login',
                args: [app, chain, cfg]
            }
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    private async _selectWalletViaOverlay(app: string | DefaultSigners, chain: ChainTypes): Promise<void> {
        const activeTab = await getCurrentTab();
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_LOGIN_OVERLAY",
            payload: {
                topic: 'login',
                args: [app, chain]
            }
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    // returns: walletType
    private async _getWalletFor(app: string | DefaultSigners): Promise<{ [chain: string]: string }> {
        const wallets = await this._globalConfigService.getWalletsUsage();
        return wallets[app] ?? {};
    }
}