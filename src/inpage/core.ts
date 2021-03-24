import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import { Overlay } from "./overlay";
import { Swiper } from "./swiper";
import { AutoProperties, EventDef, Connection } from "./connection";
import { WsJsonRpc } from "./wsJsonRpc";
import { OverlayManager } from "./overlayManager";
import { AppStorage } from "./appStorage";
import { ethers, providers } from "ethers";
import { ProxySigner } from "./proxySigner";
import * as logger from '../common/logger';
import { BackgroundNear } from "./near/backgroundNear";
import { BackgroundWalletConnection } from "./near/backgroundWalletConnection";
import { ConnectedWalletAccount, InMemorySigner } from "near-api-js";
import * as NearAPI from "near-api-js";
import { BackgroundKeyStore } from "./near/backgroundKeyStore";
import { BackgroundJsonRpcProvider } from "./near/backgroundJsonRpcProvider";

export default class Core {
    public overlayManager = new OverlayManager();
    private _popupOverlay: Overlay = null;

    constructor() {
        const closeOverlay = () => {
            if (this._popupOverlay == null) {
                this._togglePopupOverlay()
            } else {
                this._popupOverlay.open()
            }
        }

        browser.runtime.onMessage.addListener((message, sender) => {
            if (typeof message === 'string') {
                if (message === "OPEN_PAIRING_OVERLAY") {
                    return this.waitPairingOverlay().then(() => ([null, 'ready'])).catch(() => (['error']));
                } else if (message === "TOGGLE_OVERLAY") {
                    this._togglePopupOverlay();
                } else if (message === "OPEN_OVERLAY") { // used by pure jslib
                    closeOverlay();
                } else if (message === "CLOSE_OVERLAY") { // used by pure jslib
                    this.overlayManager && this.overlayManager.unregisterAll();
                }
            } else if (typeof message === 'object' && message.type !== undefined) {
                if (message.type === 'OPEN_DEPLOY_OVERLAY') {
                    return this.waitDeployOverlay(message.payload);
                } else if (message.type === 'APPROVE_SOWA_TRANSACTION') {
                    return this._approveSowaTransaction(message.payload.sowaId, message.payload.metadata).then(() => ([null, 'approved'])).catch(() => (['error']));
                } else if (message.type === 'OPEN_SETTINGS_OVERLAY') {
                    return this.waitSettingsOverlay(message.payload);
                } else if (message.type === 'OPEN_PAIRING_OVERLAY') {
                    return this.waitPairingOverlay(message.payload.topic, message.payload.args).then(() => ([null, 'ready'])).catch(() => (['error']));
                } else if (message.type === 'OPEN_LOGIN_OVERLAY') {
                    return this.waitLoginOverlay(message.payload.topic, message.payload.args).then(() => ([null, 'ready'])).catch((err) => ([err]));
                } else if (message.type === 'OPEN_POPUP_OVERLAY') {
                    return Promise.resolve(this.overlayManager.openPopup(message.payload.path));
                }
            }
        });

        const swiper = new Swiper(document.body);
        swiper.on("left", () => closeOverlay());
        swiper.on("right", () => this.overlayManager.close());
    }

    public waitPairingOverlay(topic?: string, args?: any[]): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {

            const pairingUrl = browser.extension.getURL('pairing.html');
            let overlay = this.overlayManager.getOverlays().find(x => x.uri === pairingUrl);
            if (!overlay) overlay = new Overlay(this.overlayManager, pairingUrl, 'Wallet');

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

            const url = browser.extension.getURL('login.html');
            //let overlay = this.overlayManager.getOverlays().find(x => x.uri === pairingUrl);
            const overlay = new Overlay(this.overlayManager, url, 'Login');

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
            const pairingUrl = browser.extension.getURL('deploy.html');
            const overlay = new Overlay(this.overlayManager, pairingUrl, 'Deploy');
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
            const pairingUrl = browser.extension.getURL('settings.html');
            const overlay = new Overlay(this.overlayManager, pairingUrl, 'User Settings');
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

    public _togglePopupOverlay() {
        if (!this._popupOverlay?.registered) {
            const pairingUrl = browser.extension.getURL('popup.html');
            this._popupOverlay = new Overlay(this.overlayManager, pairingUrl, 'Dapplets', true);
            this._popupOverlay.open();
        } else {
            this.overlayManager.toggle();
        }
    }

    private async _approveSowaTransaction(sowaId, metadata): Promise<void> {
        const me = this;

        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.extension.getURL('sowa.html');
            const overlay = new Overlay(me.overlayManager, pairingUrl, 'SOWA');
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
        const { sendCustomRequest, waitTransaction } = await initBGFunctions(browser);

        callback({ type: "pending" });

        try {
            const txHash = await sendCustomRequest(app, sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
            if (txHash) {
                callback({ type: "created", data: txHash });
                callback({ type: "result", data: txHash });

                const tx = await waitTransaction(app, txHash);
                callback({ type: "mined", data: tx });
            }
        } catch (err) {
            logger.error(err);
            callback({ type: "rejected" });
        }
    }

    public connect<M>(cfg: { url: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection {
        const rpc = new WsJsonRpc(cfg.url);
        const conn = Connection.create<M>(rpc, eventDef);
        return conn;
    }

    public async wallet<M>(cfg?: { username: string, domainId: number, fullname?: string, img?: string }, eventDef?: EventDef<any>, app?: string): Promise<AutoProperties<M> & Connection> {
        const { prepareWalletFor } = await initBGFunctions(browser);
        await prepareWalletFor(app, cfg);

        const me = this;
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
    }

    public overlay<M>(cfg: { url: string, title: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection {
        const _overlay = new Overlay(this.overlayManager, cfg.url, cfg.title);
        const conn = Connection.create<M>(_overlay, eventDef);
        return conn;
    }

    // ToDo: remove it or implement!
    contextStarted(contextIds: any[], parentContext?: string): void { }
    contextFinished(contextIds: any[], parentContext?: string): void { }
    onAction(handler: Function) { };
    onHome(handler: Function) { };

    public storage: AppStorage;

    public contract(address: string, abi: any, app?: string): any {
        const signer = new ProxySigner(app);
        return new ethers.Contract(address, abi, signer);
    }

    public near = {
        async wallet(app?: string) {
            const { localStorage_getItem, pairWalletViaOverlay } = await initBGFunctions(browser);
            const authDataKey = 'null_wallet_auth_key';
            let authData = JSON.parse(await localStorage_getItem(authDataKey));
            if (!authData) {
                await pairWalletViaOverlay();
                authData = JSON.parse(await localStorage_getItem(authDataKey));
            }
            
            const near = new BackgroundNear(app);
            const wallet = new BackgroundWalletConnection(near, null);
            wallet._authData = authData;

            const account = wallet.account();
            return account;
        },

        async contract(contractId: string, options: { viewMethods: string[]; changeMethods: string[] }, app?: string) {
            const { localStorage_getItem, pairWalletViaOverlay } = await initBGFunctions(browser);
            const authDataKey = 'null_wallet_auth_key';
            let authData = JSON.parse(await localStorage_getItem(authDataKey));
            if (!authData) {
                await pairWalletViaOverlay();
                authData = JSON.parse(await localStorage_getItem(authDataKey));
            }
            
            const near = new BackgroundNear(app);
            const wallet = new BackgroundWalletConnection(near, null);
            wallet._authData = authData;

            const account = wallet.account();
            const contract = await new NearAPI.Contract(account, contractId, options);
            return contract;
        }
    }
}