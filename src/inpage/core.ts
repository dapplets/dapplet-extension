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
                }
            }
        });

        const swiper = new Swiper(document.body);
        swiper.on("left", () => closeOverlay());
        swiper.on("right", () => this.overlayManager.close());
    }

    public waitPairingOverlay(): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.extension.getURL('pairing.html');
            const overlay = new Overlay(this.overlayManager, pairingUrl, 'Wallet');
            overlay.open();
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

    public waitDeployOverlay(payload: any): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {
            const pairingUrl = browser.extension.getURL('deploy.html');
            const overlay = new Overlay(this.overlayManager, pairingUrl, 'Deploy');
            overlay.open(() => overlay.send('data', [payload]));
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
            const overlay = new Overlay(this.overlayManager, pairingUrl, 'Settings');
            overlay.open(() => overlay.send('data', [payload]));
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
            this._popupOverlay = new Overlay(this.overlayManager, pairingUrl, 'Dapplets');
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
    private async _sendWalletConnectTx(sowaIdOrRpcMethod, sowaMetadataOrRpcParams, callback: (e: { type: string, data?: any }) => void): Promise<any> {
        const backgroundFunctions = await initBGFunctions(browser);
        const {
            loadSowa,
            loadSowaFrames,
            transactionCreated,
            transactionRejected,
            checkConnection,
            getGlobalConfig,
            sendLegacyTransaction,
            sendCustomRequest
        } = backgroundFunctions;

        const isConnected = await checkConnection();


        if (!isConnected) {
            callback({ type: "pairing" });
            await this.waitPairingOverlay();
            callback({ type: "paired" });
        }

        callback({ type: "pending" });

        let dappletResult = null;

        const { walletInfo } = await getGlobalConfig();

        const compatibleJsonRpc = ['personal_sign', 'eth_accounts', 'eth_sendTransaction'];

        if (compatibleJsonRpc.includes(sowaIdOrRpcMethod)) {
            const result = await sendCustomRequest(sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
            callback({ type: "result", data: result });
            return result;
        } else {
            if (walletInfo.protocolVersion === "0.2.0") {
                console.log("[DAPPLETS]: Wallet is SOWA Frames compatible. Sending SOWA Frames transaction...");
                dappletResult = await loadSowaFrames(sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
            } else if (walletInfo.protocolVersion === "0.1.0") {
                console.log("[DAPPLETS]: Wallet is SOWA compatible. Sending SOWA transaction...");
                dappletResult = await loadSowa(sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
            } else {
                console.log("[DAPPLETS]: Wallet is SOWA incompatible. Showing SOWA view...");

                try {
                    await this._approveSowaTransaction(sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
                    dappletResult = await sendLegacyTransaction(sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
                } catch (err) {
                    logger.error(err);
                }
            }

            if (dappletResult) {
                transactionCreated(dappletResult);
                callback({ type: "created", data: dappletResult });
            } else {
                transactionRejected();
                callback({ type: "rejected" });
            }

            return dappletResult;
        }
    }

    public connect<M>(cfg: { url: string }, eventDef?: EventDef<any>): AutoProperties<M> & Connection {
        const rpc = new WsJsonRpc(cfg.url);
        const conn = Connection.create<M>(rpc, eventDef);
        return conn;
    }

    public wallet<M>(cfg?: {}, eventDef?: EventDef<any>): AutoProperties<M> & Connection {
        const me = this;
        const transport = {
            _txCount: 0,
            _handler: null,
            exec: (sowaIdOrRpcMethod: string, sowaMetadataOrRpcParams: any) => {
                const id = (++transport._txCount).toString();
                me._sendWalletConnectTx(sowaIdOrRpcMethod, sowaMetadataOrRpcParams, (e) => transport._handler(id, e));
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

    public storage: AppStorage;

    public contract(address: string, abi: any): any {
        const signer = new ProxySigner();
        return new ethers.Contract(address, abi, signer);
    }
}