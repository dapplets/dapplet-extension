import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { IOverlay, IOverlayManager } from "./overlay/interfaces";
import { Swiper } from "./swiper";
import { AutoProperties, EventDef, Connection } from "./connection";
import { WsJsonRpc } from "./wsJsonRpc";
import { AppStorage } from "./appStorage";
import * as ethers from "ethers";
import { ProxySigner } from "./proxySigner";

import { BackgroundNear } from "./near/backgroundNear";
import { BackgroundWalletConnection } from "./near/backgroundWalletConnection";
import * as NearAPI from "near-api-js";
import { SystemOverlayTabs } from "../common/types";
import { parseShareLink } from "../common/helpers";

type Abi = any;

interface WalletConnection {
    isConnected(): Promise<boolean>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}

type ContentDetector = {
    contextId: string;
    selector: string;
}

export default class Core {
    private _popupOverlay: IOverlay = null;

    constructor(isIframe: boolean, public overlayManager: IOverlayManager) {
        if (!isIframe) {
            browser.runtime.onMessage.addListener((message, sender) => {
                if (typeof message === 'string') {
                    if (message === "TOGGLE_OVERLAY") {
                        this.toggleOverlay();
                    } else if (message === "OPEN_OVERLAY") { // used by pure jslib
                        this.openOverlay();
                    } else if (message === "CLOSE_OVERLAY") { // used by pure jslib
                        this.closeOverlay();
                    }
                } else if (typeof message === 'object' && message.type !== undefined) {
                    if (message.type === 'OPEN_DEPLOY_OVERLAY') {
                        return this.waitDeployOverlay(message.payload);
                    } else if (message.type === 'APPROVE_SOWA_TRANSACTION') {
                        return this._approveSowaTransaction(message.payload.sowaId, message.payload.metadata).then(() => ([null, 'approved'])).catch(() => (['error']));
                    } else if (message.type === 'OPEN_SETTINGS_OVERLAY') {
                        return this.waitSettingsOverlay(message.payload);
                    } else if (message.type === 'OPEN_GUIDE_OVERLAY') {
                        return this.waitGuideOverlay(message.payload);
                    } else if (message.type === 'OPEN_PAIRING_OVERLAY') {
                        return this.waitPairingOverlay(message.payload.topic, message.payload.args).then(() => ([null, 'ready'])).catch(() => (['error']));
                    } else if (message.type === 'OPEN_LOGIN_OVERLAY') {
                        return this.waitLoginOverlay(message.payload.topic, message.payload.args).then(() => ([null, 'ready'])).catch((err) => ([err]));
                    } else if (message.type === 'OPEN_POPUP_OVERLAY') {
                        return Promise.resolve(this.overlayManager.openPopup(message.payload.path));
                    }
                }
            });

            // API for context web pages
            window.addEventListener('message', ({ data }) => {
                if (typeof data === 'object' && data.type !== undefined) {
                    if (data.type === 'OPEN_POPUP_OVERLAY') {
                        return Promise.resolve(this.overlayManager.openPopup(data.payload.path));
                    } else if (data.type === 'CLOSE_OVERLAY') {
                        this.closeOverlay();
                    }
                }
            });

            const swiper = new Swiper(document.body);
            swiper.on("left", () => this.openOverlay());
            swiper.on("right", () => this.overlayManager.close());
        }
    }

    public waitPairingOverlay(topic?: string, args?: any[]): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {

            const pairingUrl = browser.runtime.getURL('pairing.html');
            let overlay = me.overlayManager.getOverlays().find(x => x.uri === pairingUrl);
            if (!overlay) overlay = me.overlayManager.createOverlay(pairingUrl, 'Wallet');

            overlay.open();

            // ToDo: add overlay.onclose

            // ToDo: add timeout?
            overlay.onMessage((topic, message) => {
                if (topic === 'ready') {
                    overlay.close();
                    resolve();
                }

                if (topic === 'error') {
                    reject();
                }
            });

            if (topic) {
                overlay.send(topic, args);
            }
        });
    }

    public waitLoginOverlay(topic?: string, args?: any[]): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {

            const url = browser.runtime.getURL('login.html');
            //let overlay = this.overlayManager.getOverlays().find(x => x.uri === pairingUrl);
            const overlay = me.overlayManager.createOverlay(url, 'Login');

            overlay.open();

            overlay.onclose = () => reject('Login rejected');

            // ToDo: add timeout?
            overlay.onMessage((topic, message) => {
                if (topic === 'ready') {
                    overlay.onclose = null;
                    overlay.close();
                    resolve();
                }

                if (topic === 'error') {
                    reject();
                }
            });

            if (topic) {
                overlay.send(topic, args);
            }
        });
    }

    public waitDeployOverlay(payload: any): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.runtime.getURL('deploy.html');
            const overlay = me.overlayManager.createOverlay(pairingUrl, 'Deploy');
            overlay.open(() => overlay.send('data', [payload]));

            // ToDo: add overlay.onclose

            // ToDo: add timeout?
            overlay.onMessage((topic, message) => {
                if (topic === 'ready') {
                    overlay.close();
                    resolve();
                }

                if (topic === 'error') {
                    reject();
                }
            });
        });
    }

    public waitSettingsOverlay(payload: any): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.runtime.getURL('settings.html');
            const overlay = me.overlayManager.createOverlay(pairingUrl, 'User Settings');
            overlay.open(() => overlay.send('data', [payload]));

            // ToDo: add overlay.onclose


            // ToDo: add timeout?
            overlay.onMessage((topic, message) => {
                if (topic === 'ready') {
                    overlay.close();
                    resolve();
                }

                if (topic === 'error') {
                    reject();
                }
            });
        });
    }

    public async waitGuideOverlay(payload: any): Promise<void> {
        const pairingUrl = browser.runtime.getURL('guide.html');
        const overlay = this.overlayManager.createOverlay(pairingUrl, 'Upgrade Guide');
        overlay.open(() => overlay.send('data', [payload]));
    }

    public async waitSystemOverlay(payload: { activeTab: SystemOverlayTabs, payload: any }): Promise<void> {
        const pairingUrl = browser.runtime.getURL('overlay.html');
        const overlay = this.overlayManager.createOverlay(pairingUrl, 'System');
        overlay.open(() => overlay.send('data', [payload]));
        overlay.onMessage((topic) => {
            if (topic === 'cancel') {
                overlay.close();
            } else if (topic === 'ready') {
                overlay.close();
            }
        });
    }

    public toggleOverlay() {
        if (!this._popupOverlay?.registered) {
            const pairingUrl = browser.runtime.getURL('popup.html');
            this._popupOverlay = this.overlayManager.createOverlay(pairingUrl, 'Dapplets', true);
            this._popupOverlay.open();
        } else {
            this.overlayManager.toggle();
        }
    }

    public closeOverlay() {
        this.overlayManager && this.overlayManager.unregisterAll();
    }

    public openOverlay() {
        if (this._popupOverlay == null) {
            this.toggleOverlay()
        } else {
            this._popupOverlay.open()
        }
    }

    private async _approveSowaTransaction(sowaId, metadata): Promise<void> {
        const me = this;

        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.runtime.getURL('sowa.html');
            const overlay = me.overlayManager.createOverlay(pairingUrl, 'SOWA');
            // ToDo: implement multiframe
            overlay.open(() => overlay.send('txmeta', [sowaId, metadata]));
            // ToDo: add timeout?
            overlay.onMessage((topic, message) => {
                if (topic === 'approved') {
                    resolve();
                    overlay.close();
                }

                if (topic === 'error') {
                    reject();
                    overlay.close();
                }
            });
        });
    }

    // ToDo: use sendSowaTransaction method from background
    private async _sendWalletConnectTx(app: string, sowaIdOrRpcMethod, sowaMetadataOrRpcParams, callback: (e: { type: string, data?: any }) => void): Promise<any> {
        const { eth_sendCustomRequest, eth_waitTransaction } = await initBGFunctions(browser);

        callback({ type: "pending" });

        try {
            const txHash = await eth_sendCustomRequest(app, sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
            if (typeof txHash === 'string' && txHash.startsWith('0x') && txHash.length === 66) {
                callback({ type: "created", data: txHash });
                const tx = await eth_waitTransaction(app, txHash);
                callback({ type: "mined", data: tx });
            } else {
                callback({ type: "result", data: txHash });
            }
        } catch (err) {
            console.error(err);
            callback({ type: "rejected" });
        }
    }

    public connect<M>(cfg: { url: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection {
        const rpc = new WsJsonRpc(cfg.url);
        const conn = Connection.create<M>(rpc, eventDef);
        return conn;
    }

    public async wallet<M>(cfg: { type: 'ethereum', network: 'rinkeby', username?: string, domainId?: number, fullname?: string, img?: string }, eventDef?: EventDef<any>, app?: string): Promise<WalletConnection & AutoProperties<M> & Connection>
    public async wallet<M>(cfg: { type: 'near', network: 'testnet', username?: string, domainId?: number, fullname?: string, img?: string }, eventDef?: EventDef<any>, app?: string): Promise<WalletConnection & NearAPI.ConnectedWalletAccount>
    public async wallet<M>(cfg: { type: 'ethereum' | 'near', network: 'rinkeby' | 'testnet', username?: string, domainId?: number, fullname?: string, img?: string }, eventDef?: EventDef<any>, app?: string) {
        if (!cfg || !cfg.type || !cfg.network) throw new Error("\"type\" and \"network\" are required in Core.wallet().");
        if (cfg.type !== 'near' && cfg.type !== 'ethereum') throw new Error("The \"ethereum\" and \"near\" only are supported in Core.wallet().");
        if (cfg.type === 'near' && cfg.network !== 'testnet') throw new Error("\"testnet\" network only is supported in \"near\" type wallet.");
        if (cfg.type === 'ethereum' && cfg.network !== 'rinkeby') throw new Error("\"rinkeby\" network only is supported in \"ethereum\" type wallet.");

        const me = this;

        const isConnected = async () => {
            const { getWalletDescriptors } = await initBGFunctions(browser);
            const descriptors = await getWalletDescriptors();
            const suitableWallet = descriptors.find(x => x.chain === cfg.type && x.apps.indexOf(app) !== -1);
            return suitableWallet ? suitableWallet.connected : false;
        };

        const getWalletObject = async () => {
            const connected = await isConnected();
            if (!connected) return null;

            if (cfg.type === 'ethereum') {
                const transport = {
                    _txCount: 0,
                    _handler: null,
                    exec: (sowaIdOrRpcMethod: string, sowaMetadataOrRpcParams: any) => {
                        const id = (++transport._txCount).toString();
                        me._sendWalletConnectTx(app, sowaIdOrRpcMethod, sowaMetadataOrRpcParams, (e) => transport._handler(id, e));
                        return Promise.resolve(id);
                    },
                    onMessage: (handler: (topic: string, message: any) => void) => {
                        transport._handler = handler;
                        return {
                            off: () => transport._handler = null
                        }
                    }
                }

                const conn = Connection.create<M>(transport, eventDef);
                return conn;
            } else if (cfg.type === 'near') {
                const { localStorage_getItem } = await initBGFunctions(browser);
                const authDataKey = 'null_wallet_auth_key';
                let authData = JSON.parse(await localStorage_getItem(authDataKey));
                if (!authData) return null;

                const near = new BackgroundNear(app);
                const wallet = new BackgroundWalletConnection(near, null, app);
                wallet._authData = authData;
                return wallet.account();
            } else {
                throw new Error('Invalid wallet type.');
            }
        };

        const _wallet = await getWalletObject();

        const proxied = {
            _wallet: _wallet,

            async isConnected(): Promise<boolean> {
                return isConnected();
            },

            async connect(): Promise<void> {
                const { prepareWalletFor } = await initBGFunctions(browser);
                await prepareWalletFor(app, cfg.type, cfg);
                this._wallet = await getWalletObject();
            },

            async disconnect(): Promise<void> {
                const { unsetWalletFor } = await initBGFunctions(browser);
                await unsetWalletFor(app, cfg.type);
                this._wallet = null;
            }
        };

        return new Proxy(proxied, {
            get(target, prop) {
                if (prop in target) {
                    return target[prop];
                } else if (target._wallet !== null) {
                    return target._wallet[prop];
                }
            }
        }) as any;
    }

    public overlay<M>(cfg: { name: string, url?: string, title: string, source?: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection & { isOpen(): boolean, close(): void }
    public overlay<M>(cfg: { name?: string, url: string, title: string, source?: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection & { isOpen(): boolean, close(): void }
    public overlay<M>(cfg: { name: string, url: string, title: string, source?: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection & { isOpen(): boolean, close(): void } {
        const _overlay = this.overlayManager.createOverlay(cfg.url, cfg.title);
        _overlay.source = cfg.source;
        const conn = Connection.create<M>(_overlay, eventDef);
        const overrides = {
            isOpen() {
                return _overlay.registered;
            },
            close() {
                _overlay.close();
            }
        }
        return Object.assign(conn, overrides);
    }

    // ToDo: remove it or implement!
    contextStarted(contextIds: any[], parentContext?: string): void { }
    contextFinished(contextIds: any[], parentContext?: string): void { }
    onAction(handler: Function) { };
    onHome(handler: Function) { };
    onShareLink(handler: (data: any) => void) { };

    public storage: AppStorage;

    public contract(type: 'ethereum', address: string, options: Abi, app?: string): any
    public contract(type: 'near', address: string, options: { viewMethods: string[]; changeMethods: string[] }, app?: string): any
    public contract(type: 'near' | 'ethereum', address: string, options: any, app?: string): any {
        if (type === 'ethereum') {
            const signer = new ProxySigner(app);
            return new ethers.Contract(address, options, signer);
        } else if (type === 'near') {
            const near = new BackgroundNear(app);
            const wallet = new BackgroundWalletConnection(near, null, app);
            const account = wallet.account();
            const contract = new NearAPI.Contract(account, address, options);
            return contract;
        } else {
            throw new Error("\"ethereum\" and \"near\" contracts only are supported.");
        }
    }

    public getContentDetectors(): ContentDetector[] {
        return [{
            contextId: 'video',
            selector: 'video'
        }];
    }

    utils = ethers.utils;

    BigNumber = ethers.BigNumber;

    public starterOverlay() {
        return this.overlay({ url: browser.runtime.getURL('starter.html'), title: 'Starter' });
    }

    public createShareLink(targetUrl: string, modulePayload: any, _env?: { contextIds: string[], registry: string, moduleId: string }): string {
        const groups = /https:\/\/augm\.link\/live\/(.*)/gm.exec(targetUrl);
        const [, targetUrlNoProxy] = groups ?? [];
        if (targetUrlNoProxy) targetUrl = targetUrlNoProxy;
        const { urlNoPayload } = parseShareLink(targetUrl); // prevent duplicate of base64 payload
        const payload = [EXTENSION_VERSION, _env.registry, _env.moduleId, ['*'], modulePayload];
        const base64Payload = btoa(JSON.stringify(payload));
        const WEB_PROXY_URL = 'https://augm.link/live/';
        return WEB_PROXY_URL + urlNoPayload + '#dapplet/' + base64Payload;
    }
}