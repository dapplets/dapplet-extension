import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { NearWallet } from "../interface";
import * as nearAPI from 'near-api-js';
import { CustomWalletConnection } from "./customWalletConnection";
import { browser } from "webextension-polyfill-ts";
import { ConnectedWalletAccount, Connection, Contract, Near } from "near-api-js";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { generateGuid, timeoutPromise, waitTab } from "../../../../common/helpers";

export default class implements NearWallet {

    private __nearWallet: CustomWalletConnection = null;

    private get _nearWallet() {
        if (!this.__nearWallet) {
            const near = new Near({
                networkId: 'default',
                nodeUrl: 'https://rpc.testnet.near.org',
                walletUrl: 'https://wallet.testnet.near.org',
                helperUrl: 'https://helper.testnet.near.org',
                deps: {
                    keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
                }
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

    async sendCustomRequest(method: string, params: any): Promise<any> {
        const provider: JsonRpcProvider = this._nearWallet.account().connection.provider as any;
        return provider.sendJsonRpc(method, params);
    }

    async requestSignTransactions(transactions: any, callbackUrl: any) {
        return this._nearWallet.requestSignTransactions(transactions, callbackUrl);
    }

    connect(provider: Provider): ethers.Signer {
        throw new Error("connect() is not implemented");
    }

    async isAvailable() {
        return true;
    }

    async isConnected() {
        const accountId = this._nearWallet.getAccountId();
        return accountId && accountId.length > 0;
    }

    async connectWallet(): Promise<void> {
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        const currentTabId = currentTab.id;

        const requestId = generateGuid();
        const callbackUrl = browser.runtime.getURL(`callback.html?request_id=${requestId}`);

        let callbackTab = null;
        const waitTabPromise = waitTab(callbackUrl).then(x => callbackTab = x);
        const requestPromise = this._nearWallet.requestSignIn({
            successUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=true`),
            failureUrl: browser.runtime.getURL(`callback.html?request_id=${requestId}&success=false`)
        });

        await Promise.race([waitTabPromise, requestPromise]);

        await browser.tabs.update(currentTabId, { active: true });

        if (!callbackTab) throw new Error('Wallet connection request rejected.');

        await browser.tabs.remove(callbackTab.id);

        const urlObject = new URL(callbackTab.url);
        const success = urlObject.searchParams.get('success') === "true";

        if (!success) throw new Error('Wallet connection request rejected');

        const accountId = urlObject.searchParams.get('account_id');
        const publicKey = urlObject.searchParams.get('public_key');
        const allKeys = urlObject.searchParams.get('all_keys');

        // TODO: Handle situation when access key is not added
        if (!accountId) throw new Error('No account_id params in callback URL');

        this._nearWallet.completeSignIn(accountId, publicKey, allKeys);
        localStorage['near_lastUsage'] = new Date().toISOString();
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

    getAccount() {
        return this._nearWallet.account();
    }
}