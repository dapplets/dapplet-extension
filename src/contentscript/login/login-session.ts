import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import * as near from "../near";
import * as ethereum from "../ethereum";

export class LoginSession {
    sessionId: string = null;
    moduleName: string = null;
    authMethod: string = null;
    walletType: string = null;
    expiresAt: string = null;
    createdAt: string = null;
    loginConfirmation?: { loginMessage: string, signature: string } = null;

    logoutHandler?: (ls: any) => void;

    private get _network() {
        return this.authMethod.split('/')[0]; // ethereum, near
    }

    private get _chain() {
        return this.authMethod.split('/')[1]; // goerli, testnet, mainnet
    }

    private get _isExpired() {
        const expiresAt = new Date(this.expiresAt).getTime();
        const now = Date.now();
        return expiresAt < now;
    }

    constructor(serializedSession: any) {
        Object.assign(this, serializedSession);
    }

    async isValid(): Promise<boolean> {
        if (this._isExpired) return false;
        const { isValidSession } = await initBGFunctions(browser);
        return await isValidSession(this.sessionId);
    }

    async logout() {
        const { killSession } = await initBGFunctions(browser);
        await killSession(this.sessionId);
        const ls = {}; // ToDo: specify session
        this.logoutHandler?.call({}, ls);
    }

    async wallet(): Promise<any> {
        if (!await this.isValid()) return null;
        return this._getWalletObject();
    }

    async contract(address: string, options: any): Promise<any> {
        if (this._network === 'ethereum') {
            return ethereum.createContractWrapper(this.sessionId, { network: this._chain }, address, options);
        } else if (this._network === 'near') {
            return near.createContractWrapper(this.sessionId, { network: this._chain }, address, options);
        } else {
            throw new Error(`Current auth method "${this._network}" doesn't support contract interactions.`);
        }
    }

    async getItem(key: string): Promise<any> {
        const { getSessionItem } = await initBGFunctions(browser);
        return getSessionItem(this.sessionId, key);
    }

    async setItem(key: string, value: any): Promise<void> {
        const { setSessionItem } = await initBGFunctions(browser);
        return setSessionItem(this.sessionId, key, value);
    }

    async removeItem(key: string): Promise<void> {
        const { removeSessionItem } = await initBGFunctions(browser);
        return removeSessionItem(this.sessionId, key);
    }

    async clear(): Promise<void> {
        const { clearSessionItems } = await initBGFunctions(browser);
        return clearSessionItems(this.sessionId);
    }

    private async _getWalletObject() {
        if (this._network === 'ethereum') {
            // ToDo: events def
            const wallet = await ethereum.createWalletConnection(this.moduleName, { network: this._chain });
            return {
                request: ({ method, params }: { method: string, params: any[] }): Promise<any> => {
                    return new Promise((res, rej) => {
                        wallet.sendAndListen(method, params, { 
                            result: (_, { data }) => {
                                res(data[0])
                            },
                            rejected: (_, { data }) => {
                                rej(data[0])
                            },
                        });
                    });
                }
            };
        } else if (this._network === 'near') {
            return near.createWalletConnection(this.moduleName, { network: this._chain });
        } else {
            throw new Error(`Current auth method "${this._network}" doesn't support wallet connections.`);
        }
    };
}