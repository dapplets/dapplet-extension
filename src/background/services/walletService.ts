import { providers, Signer, utils } from 'ethers';
import { browser } from 'webextension-polyfill-ts';
import { getCurrentTab } from '../../common/helpers';
import { ExtendedSigner } from '../signers/interface';
import * as signers from '../signers';
import GlobalConfigService from './globalConfigService';

export type WalletDescriptor = {
    type: string;
    meta: {
        icon: string;
        name: string;
        description: string;
    } | null;
    connected: boolean;
    account: string;
    chainId: number;
    apps: string[];
    default: boolean;
    lastUsage: string;
}

export class WalletService {

    private _map: { [key: string]: ExtendedSigner } = {};

    constructor(private _globalConfigService: GlobalConfigService) {
        Object.entries(signers).forEach(([k, v]) => this._map[k] = new v());
    }

    async connectWallet(type: string) {
        return this._map[type].connectWallet();
    }

    async disconnectWallet(type: string) {
        return this._map[type].disconnectWallet();
    }

    async getWalletDescriptors(): Promise<WalletDescriptor[]> {
        const wallet = await this.getWalletFor('extension');
        const wallets = await this._globalConfigService.getWalletsUsage();

        return Promise.all(Object.entries(this._map).map(async ([k, v]) => {
            const meta = await v.getMeta();
            const account = await v.getAddress();
            const chainId = await v.getChainId();

            return ({
                type: k,
                meta,
                connected: v.isConnected(),
                account,
                chainId,
                apps: Object.entries(wallets).filter(([_, v]) => v === k).map(([k, v]) => k),
                default: k === wallet,
                lastUsage: v.getLastUsage()
            })
        }));
    }

    async getSignerFor(app: string): Promise<Signer> {
        const me = this;
        return new (class extends Signer {
            provider = new providers.JsonRpcProvider('https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992', 'rinkeby');

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
                const signer = await me._getInternalSignerFor(app) ?? await me._pairSignerFor(app);
                return signer.sendTransaction(transaction);
            }

            connect(provider: providers.Provider): Signer {
                throw new Error('Method not implemented.');
            }
        })();
    }

    public async getWalletFor(app: string) {
        const wallets = await this._globalConfigService.getWalletsUsage();
        return wallets[app];
    }

    public async setWalletFor(walletType: string, app: string) {
        const wallets = await this._globalConfigService.getWalletsUsage();
        wallets[app] = walletType;
        await this._globalConfigService.setWalletsUsage(wallets);
    }

    public async pairWalletViaOverlay(): Promise<void> {
        const activeTab = await getCurrentTab();
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, "OPEN_PAIRING_OVERLAY");
        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    public async getAddress(app: string): Promise<string> {
        const signer = await this._getInternalSignerFor(app);
        return signer?.getAddress() ?? '0x0000000000000000000000000000000000000000';
    }

    public async sendTransactionOutHash(app: string, transaction: providers.TransactionRequest): Promise<string> {
        const signer = await this._getInternalSignerFor(app) ?? await this._pairSignerFor(app);
        return signer.sendTransactionOutHash(transaction);
    }

    public async sendCustomRequest(app: string, method: string, params: any[]): Promise<any> {
        const signer = await this._getInternalSignerFor(app) ?? await this._pairSignerFor(app);
        return signer.sendCustomRequest(method, params);
    }

    private async _getInternalSignerFor(app: string): Promise<ExtendedSigner> {
        const walletType = await this.getWalletFor(app);

        if (walletType && this._map[walletType].isConnected()) return this._map[walletType];

        // ToDo: clean walletType?

        // choose first connected wallet
        for (const key in this._map) {
            if (this._map[key].isConnected()) {
                return this._map[key];
            }
        }
    }

    private async _pairSignerFor(app: string): Promise<ExtendedSigner> {
        // pairing
        await this.pairWalletViaOverlay();

        // choose first connected wallet
        for (const key in this._map) {
            if (this._map[key].isConnected()) {
                return this._map[key];
            }
        }

        throw new Error('Cannot find signer');
    }
}