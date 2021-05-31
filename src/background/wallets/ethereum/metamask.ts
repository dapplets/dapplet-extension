import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { Deferrable, SupportedAlgorithm } from "ethers/lib/utils";
import { EthereumWallet } from "./interface";
import createMetaMaskProvider from 'metamask-extension-provider';

export default class extends ethers.Signer implements EthereumWallet {

    public provider: ethers.providers.StaticJsonRpcProvider;
    private _metamaskProvider;
    private _available = false;

    private get _metamask() {
        if (!this._metamaskProvider) {
            this._metamaskProvider = window['ethereum'] ?? createMetaMaskProvider();
            this._metamask['autoRefreshOnNetworkChange'] = false; // silence the warning from metamask https://docs.metamask.io/guide/ethereum-provider.html#ethereum-autorefreshonnetworkchange 
            this._metamaskProvider.on('connect', () => this._available = true);
            this._metamaskProvider.on('disconnect', () => (this._available = false, this._metamaskProvider = null));
            // another available events: _initialized, chainChanged, networkChanged, accountsChanged, message, data, error
            // this._metamaskProvider.on('connect', (...args) => console.log('connect', args))
            // this._metamaskProvider.on('disconnect', (...args) => console.log('disconnect', args))
            // this._metamaskProvider.on('_initialized', (...args) => console.log('_initialized', args))
            // this._metamaskProvider.on('chainChanged', (...args) => console.log('chainChanged', args))
            // this._metamaskProvider.on('networkChanged', (...args) => console.log('networkChanged', args))
            // this._metamaskProvider.on('accountsChanged', (...args) => console.log('accountsChanged', args))
            // this._metamaskProvider.on('message', (...args) => console.log('message', args))
            // this._metamaskProvider.on('data', (...args) => console.log('data', args))
        }
        return this._metamaskProvider;
    }

    constructor(config: { providerUrl: string }) {
        super();
        this.provider = new ethers.providers.StaticJsonRpcProvider(config.providerUrl);
    }

    async getAddress(): Promise<string> {
        // ToDo: replace to ethereum.request({ method: 'eth_accounts' }) 
        return this._metamask.selectedAddress;
    }

    async signMessage(message: string | ethers.Bytes): Promise<string> {
        throw new Error('Not implemented');
    }

    async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        throw new Error('Not implemented');
    }

    async sendTransaction(transaction: TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        const txHash = await this.sendTransactionOutHash(transaction);

        // the wait of a transaction from another provider can be long
        let tx = null;
        while (tx === null) {
            await new Promise((res) => setTimeout(res, 1000));
            tx = await this.provider.getTransaction(txHash);
        }

        return tx;
    }

    async sendTransactionOutHash(transaction: TransactionRequest): Promise<string> {
        localStorage['metamask_lastUsage'] = new Date().toISOString();
        transaction.from = await this.getAddress();
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await this._metamask.request({
            method: 'eth_sendTransaction',
            params: [tx]
        }) as string;
        return txHash;
    }

    async sendCustomRequest(method: string, params: any[]): Promise<any> {
        return this._metamask.request({ method, params });
    }

    connect(provider: Provider): ethers.Signer {
        throw new Error("Method not implemented.");
    }

    isAvailable() {
        return this._available;
    }

    isConnected() {
        const disabled = localStorage['metamask_disabled'] === 'true';
        return this._metamask.isConnected() && !!this._metamask.selectedAddress && !disabled;
    }

    async connectWallet(): Promise<void> {
        if (localStorage['metamask_disabled'] === 'true') {
            await this._metamask.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
            delete localStorage['metamask_disabled'];
        } else {
            await this._metamask.request({ method: 'eth_requestAccounts' });
        }
        localStorage['metamask_lastUsage'] = new Date().toISOString();
    }

    async disconnectWallet() {
        localStorage['metamask_disabled'] = 'true';
        delete localStorage['metamask_lastUsage'];
    }

    async getMeta() {
        return {
            name: 'MetaMask',
            description: 'MetaMask Browser Extension',
            icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg'
        }
    }

    getLastUsage() {
        return localStorage['metamask_lastUsage'];
    }
}