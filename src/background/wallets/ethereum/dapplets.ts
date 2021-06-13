import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { EthereumWallet } from "./interface";

export default class extends ethers.Signer implements EthereumWallet {

    public provider: ethers.providers.StaticJsonRpcProvider;
    private _wallet: ethers.Wallet = null;

    constructor(config: { providerUrl: string }) {
        super();
        this.provider = new ethers.providers.StaticJsonRpcProvider(config.providerUrl);
        if (localStorage['dapplets_privateKey']) {
            this._wallet = new ethers.Wallet(localStorage['dapplets_privateKey'], this.provider);
        }
    }
    
    getAddress(): Promise<string> {
        if (!this._wallet) return null;
        return this._wallet.getAddress();
    }

    signMessage(message: string | ethers.utils.Bytes): Promise<string> {
        if (!this._wallet) throw new Error("Wallet is not connected 2");
        return this._wallet.signMessage(message);
    }

    signTransaction(transaction: TransactionRequest): Promise<string> {
        if (!this._wallet) throw new Error("Wallet is not connected 3");
        return this._wallet.signTransaction(transaction);
    }

    connect(provider: Provider): ethers.Signer {
        if (!this._wallet) throw new Error("Wallet is not connected 4");
        return this._wallet.connect(provider);
    }

    async sendTransaction(transaction: TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        if (!this._wallet) throw new Error("Wallet is not connected 5");
        localStorage['dapplets_lastUsage'] = new Date().toISOString();
        return this._wallet.sendTransaction(transaction);
    }

    async sendTransactionOutHash(transaction: TransactionRequest): Promise<string> {
        if (!this._wallet) throw new Error("Wallet is not connected 6");
        localStorage['dapplets_lastUsage'] = new Date().toISOString();
        const tx = await this._wallet.sendTransaction(transaction);
        return tx.hash;
    }

    async sendCustomRequest(method: string, params: any[]): Promise<any> {
        if (!this._wallet) throw new Error("Wallet is not connected 7");
        return this.provider.send(method, params);
    }

    isAvailable() {
        return true;
    }

    isConnected() {
        return !!localStorage['dapplets_privateKey'];
    }

    async connectWallet(): Promise<void> {
        if (!localStorage['dapplets_privateKey']) {
            localStorage['dapplets_privateKey'] = ethers.Wallet.createRandom().privateKey;
        }
        localStorage['dapplets_lastUsage'] = new Date().toISOString();
        this._wallet = new ethers.Wallet(localStorage['dapplets_privateKey'], this.provider);
    }

    async disconnectWallet() {
        delete localStorage['dapplets_lastUsage'];
        delete localStorage['dapplets_privateKey'];
        this._wallet = null;
    }

    async getMeta() {
        return {
            name: 'Built-in Wallet',
            description: 'Dapplets Browser Extension',
            icon: 'https://raw.githubusercontent.com/dapplets/brand-resources/f2e83ff2fb2c6fe627502ffb3ee838299f38505f/svg/dapplets-pluggy.svg'
        }
    }

    getLastUsage() {
        return localStorage['dapplets_lastUsage'];
    }
}