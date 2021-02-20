import { providers, Signer, utils } from 'ethers';
import { browser } from 'webextension-polyfill-ts';
import { getCurrentTab } from '../../common/helpers';
import { ExtendedSigner } from '../signers/interface';
import * as signers from '../signers';
import GlobalConfigService from './globalConfigService';

export enum DefaultSigners {
    EXTENSION = 'extension'
}

export enum WalletTypes {
    WALLETCONNECT = 'walletconnect',
    METAMASK = 'metamask'
}

export type WalletDescriptor = {
    type: string;
    meta: {
        icon: string;
        name: string;
        description: string;
    } | null;
    connected: boolean;
    available: boolean;
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

    async connectWallet(type: WalletTypes) {
        return this._map[type].connectWallet();
    }

    async disconnectWallet(type: WalletTypes) {
        await this._map[type].disconnectWallet();
        const wallets = await this._globalConfigService.getWalletsUsage();
        for (const app in wallets) {
            if (wallets[app].toLowerCase() === type.toLowerCase()) {
                delete wallets[app];
            }
        }
        await this._globalConfigService.setWalletsUsage(wallets);
    }

    async getWalletDescriptors(): Promise<WalletDescriptor[]> {
        const wallet = await this.getWalletFor(DefaultSigners.EXTENSION);
        const wallets = await this._globalConfigService.getWalletsUsage();

        return Promise.all(Object.entries(this._map).map(async ([k, v]) => {
            const meta = await v.getMeta();
            const account = await v.getAddress();
            const chainId = await v.getChainId();

            return ({
                type: k,
                meta,
                connected: v.isConnected(),
                available: v.isAvailable(),
                account,
                chainId,
                apps: Object.entries(wallets).filter(([_, v]) => v === k).map(([k, v]) => k),
                default: k === wallet,
                lastUsage: v.getLastUsage()
            })
        }));
    }

    async getSignerFor(app: string | DefaultSigners): Promise<Signer> {
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
                const signer = await me._getInternalSignerFor(app) ?? await me._pairSignerFor(app);
                return signer.sendTransaction(transaction);
            }

            connect(provider: providers.Provider): Signer {
                throw new Error('Method not implemented.');
            }
        })();
    }

    // return: walletType
    public async getWalletFor(app: string | DefaultSigners) {
        const wallets = await this._globalConfigService.getWalletsUsage();
        return wallets[app];
    }

    public async setWalletFor(walletType: WalletTypes, app: string | DefaultSigners) {
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

    public async loginViaOverlay(app: string | DefaultSigners, cfg?: { username: string, domainId: number, fullname?: string, img?: string }): Promise<void> {
        const activeTab = await getCurrentTab();
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_LOGIN_OVERLAY",
            payload: {
                topic: 'login',
                args: [app, cfg]
            }
        });
        
        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    public async selectWalletViaOverlay(app: string | DefaultSigners, cfg?: { username: string, domainId: number, fullname?: string, img?: string }): Promise<void> {
        const activeTab = await getCurrentTab();
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
            type: "OPEN_LOGIN_OVERLAY",
            payload: {
                topic: 'login',
                args: [app]
            }
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    public async prepareWalletFor(app: string | DefaultSigners, cfg?: { username: string, domainId: number, fullname?: string, img?: string }) {
        const walletType = await this.getWalletFor(app);

        if (!walletType) {
            // is login required?
            if (cfg) {
                return this.loginViaOverlay(app, cfg);
            } else {
                return this.selectWalletViaOverlay(app);
            }
        }

        const pairedWallets = await this.getWalletDescriptors();
        const suitableWallet = pairedWallets.find(x => x.type === walletType);

        if (!suitableWallet || !suitableWallet.connected) {
            // is login required?
            if (cfg) {
                return this.loginViaOverlay(app, cfg);
            } else {
                return this.selectWalletViaOverlay(app);
            }
        }
    }

    public async getAddress(app: string | DefaultSigners): Promise<string> {
        const signer = await this._getInternalSignerFor(app);
        return signer?.getAddress() ?? '0x0000000000000000000000000000000000000000';
    }

    public async sendTransactionOutHash(app: string | DefaultSigners, transaction: providers.TransactionRequest): Promise<string> {
        const signer = await this._getInternalSignerFor(app) ?? await this._pairSignerFor(app);
        return signer.sendTransactionOutHash(transaction);
    }

    public async sendCustomRequest(app: string | DefaultSigners, method: string, params: any[]): Promise<any> {
        const signer = await this._getInternalSignerFor(app) ?? await this._pairSignerFor(app);
        return signer.sendCustomRequest(method, params);
    }

    private async _getInternalSignerFor(app: string | DefaultSigners): Promise<ExtendedSigner> {
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

    private async _pairSignerFor(app: string | DefaultSigners): Promise<ExtendedSigner> {
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