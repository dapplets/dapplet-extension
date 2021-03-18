import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { ExtendedSigner } from "../interface";
import * as nearAPI from 'near-api-js';
import { CustomWalletConnection } from "./customWalletConnection";
import { browser } from "webextension-polyfill-ts";
import { Near } from "near-api-js";

export default class extends ethers.Signer implements ExtendedSigner {

    private __nearWallet: CustomWalletConnection = null;

    private get _nearWallet() {
        if (!this.__nearWallet) {
            const near = new Near({
                networkId: 'default',
                nodeUrl: 'https://rpc.testnet.near.org',
                walletUrl: 'https://wallet.testnet.near.org',
                helperUrl: 'https://helper.testnet.near.org',
                deps: { keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore() }
            });

            this.__nearWallet = new CustomWalletConnection(near, null);
        }

        return this.__nearWallet;
    }

    async getAddress(): Promise<string> {
        return this._nearWallet.getAccountId();
    }

    async getChainId() {
        return 0;
    }

    async signMessage(message: string | ethers.Bytes): Promise<string> {
        throw new Error("signMessage() is not implemented");
    }

    async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        throw new Error("signTransaction() is not implemented");
    }

    async sendTransaction(transaction: TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        throw new Error("sendTransaction() is not implemented");
    }

    async sendTransactionOutHash(transaction: TransactionRequest): Promise<string> {
        throw new Error("sendTransactionOutHash() is not implemented");
    }

    async sendCustomRequest(method: string, params: any[]): Promise<any> {
        throw new Error("sendCustomRequest() is not implemented");
    }

    connect(provider: Provider): ethers.Signer {
        throw new Error("connect() is not implemented");
    }

    isAvailable() {
        return true;
    }

    isConnected() {
        const accountId = this._nearWallet.getAccountId();
        return accountId && accountId.length > 0;
    }

    async connectWallet(): Promise<void> {
        return new Promise<void>(async (res, rej) => {
            const [currentTab] = await browser.tabs.query({ active: true });
            const currentTabId = currentTab.id;

            await this._nearWallet.requestSignIn({
                successUrl: browser.extension.getURL('pairing.html?success=true'),
                failureUrl: browser.extension.getURL('pairing.html?success=false')
            });

            let isPairing = false;

            browser.tabs.onUpdated.addListener(async (tabId) => {
                const tab = await browser.tabs.get(tabId);
                const { url } = tab;
                if (url.indexOf(browser.extension.getURL('pairing.html')) === 0) {
                    console.log(url)
                    if (isPairing) return;

                    isPairing = true;

                    const urlObject = new URL(url);

                    const success = urlObject.searchParams.get('success') === "true";

                    if (success) {
                        const accountId = urlObject.searchParams.get('account_id');
                        const publicKey = urlObject.searchParams.get('public_key');
                        const allKeys = urlObject.searchParams.get('all_keys');

                        // TODO: Handle situation when access key is not added
                        if (accountId) {
                            await browser.tabs.update(currentTabId, { active: true });
                            this._nearWallet.completeSignIn(accountId, publicKey, allKeys);
                            localStorage['near_lastUsage'] = new Date().toISOString();
                            await new Promise((res, rej) => setTimeout(res, 1000));
                            await browser.tabs.remove(tabId);
                            res();
                        } else {
                            await browser.tabs.update(currentTabId, { active: true });
                            await new Promise((res, rej) => setTimeout(res, 1000));
                            await browser.tabs.remove(tabId);
                            rej('No account_id params in callback URL');
                        }

                        isPairing = false;
                    } else {
                        await new Promise((res, rej) => setTimeout(res, 1000));
                        await browser.tabs.remove(tabId);
                        rej('Access denied');
                    }
                }
            });
        });
    }

    async disconnectWallet() {
        this._nearWallet.signOut();
    }

    async getMeta() {
        return {
            name: 'NEAR Wallet',
            description: 'NEAR Wallet',
            icon: 'https://near.org/wp-content/themes/near-19/assets/downloads/near_icon.svg'
        }
    }

    getLastUsage() {
        return localStorage['near_lastUsage'];
    }
}