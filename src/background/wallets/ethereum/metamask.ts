import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { MetaMaskInpageProvider } from '@metamask/providers';
import PortStream from 'extension-port-stream';
import { detect } from 'detect-browser';
import { browser } from 'webextension-polyfill-ts';
import { EthereumWallet } from "./interface";

export default class extends ethers.Signer implements EthereumWallet {

    public provider: ethers.providers.StaticJsonRpcProvider;
    private _metamaskProviderPromise: Promise<MetaMaskInpageProvider> | null = null;

    constructor(config: { providerUrl: string }) {
        super();
        this.provider = new ethers.providers.StaticJsonRpcProvider(config.providerUrl, 4);
    }

    async getAddress(): Promise<string> {
        try {
            // ToDo: replace to ethereum.request({ method: 'eth_accounts' }) 
            const metamask = await this._getMetamaskProvider();
            return metamask.selectedAddress;
        } catch (_) {
            return null;
        }
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
        const metamask = await this._getMetamaskProvider();
        localStorage['metamask_lastUsage'] = new Date().toISOString();
        transaction.from = await this.getAddress();
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await metamask.request({
            method: 'eth_sendTransaction',
            params: [tx]
        }) as string;
        return txHash;
    }

    async sendCustomRequest(method: string, params: any[]): Promise<any> {
        const metamask = await this._getMetamaskProvider();
        return metamask.request({ method, params });
    }

    connect(provider: Provider): ethers.Signer {
        throw new Error("Method not implemented.");
    }

    async isAvailable() {
        try {
            await this._getMetamaskProvider();
            return true
        } catch (_) {
            return false;
        }
    }

    async isConnected() {
        const disabled = localStorage['metamask_disabled'] === 'true';
        if (disabled) return false;

        try {
            const metamask = await this._getMetamaskProvider();
            return metamask.isConnected() && !!metamask.selectedAddress;
        } catch (_) {
            return false;
        }
    }

    async connectWallet(): Promise<void> {
        const metamask = await this._getMetamaskProvider();
        if (localStorage['metamask_disabled'] === 'true') {
            await metamask.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
            delete localStorage['metamask_disabled'];
        } else {
            await metamask.request({ method: 'eth_requestAccounts' });
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

    private async _getMetamaskProvider(): Promise<MetaMaskInpageProvider> {
        if (!this._metamaskProviderPromise) {
            this._metamaskProviderPromise = new Promise((res, rej) => {
                const currentMetaMaskId = this._getMetaMaskId();
                const metamaskPort = browser.runtime.connect(currentMetaMaskId);
                metamaskPort.onDisconnect.addListener(() => browser.runtime.lastError); // mute "Unchecked runtime.lastError"
                const pluginStream = new PortStream(metamaskPort);
                const metamask = new MetaMaskInpageProvider(pluginStream, {
                    // mute all messages from provider
                    logger: {
                        warn: () => {},
                        log: () => {},
                        error: () => {},
                        debug: () => {},
                        info: () => {},
                        trace: () => {}
                    }
                });
                metamask['autoRefreshOnNetworkChange'] = false; // silence the warning from metamask https://docs.metamask.io/guide/ethereum-provider.html#ethereum-autorefreshonnetworkchange 
                metamask.on('connect', () => res(metamask));
                metamask.on('disconnect', () => {
                    this._metamaskProviderPromise = null;
                    rej('MetaMask is unavailable.');
                });
                // another available events: _initialized, chainChanged, networkChanged, accountsChanged, message, data, error
                // metamask.on('connect', (...args) => console.log('connect', args))
                // metamask.on('disconnect', (...args) => console.log('disconnect', args))
                // metamask.on('_initialized', (...args) => console.log('_initialized', args))
                // metamask.on('chainChanged', (...args) => console.log('chainChanged', args))
                // metamask.on('networkChanged', (...args) => console.log('networkChanged', args))
                // metamask.on('accountsChanged', (...args) => console.log('accountsChanged', args))
                // metamask.on('message', (...args) => console.log('message', args))
                // metamask.on('data', (...args) => console.log('data', args))
            });
        }

        return this._metamaskProviderPromise;
    }

    private _getMetaMaskId() {
        const config = {
            "CHROME_ID": "nkbihfbeogaeaoehlefnkodbefgpgknn",
            "FIREFOX_ID": "webextension@metamask.io"
        }
        const browser = detect();
        switch (browser && browser.name) {
            case 'chrome':
                return config.CHROME_ID
            case 'firefox':
                return config.FIREFOX_ID
            default:
                return config.CHROME_ID
        }
    }
}