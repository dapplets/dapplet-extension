import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Connection } from './connection';
import { OverlayManager } from "./overlayManager";
import { Overlay, SubscribeOptions } from "./overlay";
import * as extension from 'extensionizer';
import { Swiper } from "./swiper";
import * as GlobalEventBus from './globalEventBus';

export default class Core {

    public overlayManager = new OverlayManager();
    private _popupOverlay: Overlay = null;

    constructor() {
        extension.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === "OPEN_PAIRING_OVERLAY") {
                this.waitPairingOverlay().finally(() => sendResponse());
            } else if (message === "TOGGLE_OVERLAY") {
                this._togglePopupOverlay();
                sendResponse();
            }
        });

        const swiper = new Swiper(document.body);
        swiper.on("left", () => {
            if (this._popupOverlay == null) {
                this._togglePopupOverlay()
            } else {
                this._popupOverlay.open()
            }
        });
        swiper.on("right", () => {
            this.overlayManager.close();
        });
    }

    public connect(url: string): Connection {
        return new Connection(url);
    }

    public publish = (topic: string, data: any) => GlobalEventBus.publish(topic, data)
    public subscribe = (topic: string, func: Function) => GlobalEventBus.subscribe(topic, func)

    public overlay(url: string, title: string) {
        const ov = new Overlay(this.overlayManager, url, title);
        const me = {
            open: (callback?: Function) => (ov.open(callback), me),
            close: () => (ov.close(), me),
            subscribe: (topic: string, handler: Function, threading?: SubscribeOptions) => (ov.subscribe(topic, handler, threading), me),
            unsubscribe: (topic: string) => (ov.unsubscribe(topic), me),
            publish: (topic: string, ...args: any) => (ov.publish(topic, ...args), me)
        };
        return me;
    }

    public waitPairingOverlay(): Promise<void> {
        const me = this;
        return new Promise<void>((resolve, reject) => {
            const pairingUrl = extension.extension.getURL('pairing.html');
            const overlay = me.overlay(pairingUrl, 'Wallet');
            overlay.open();
            // ToDo: add timeout?
            overlay.subscribe('ready', () => {
                overlay.close();
                resolve();
            }); // 'paired' - when paired, 'ready' - when user clicked on the continue button
            overlay.subscribe('error', () => reject());
        });
    }

    public _togglePopupOverlay() {
        if (!this._popupOverlay?.registered) {
            const pairingUrl = extension.extension.getURL('popup.html');
            this._popupOverlay = new Overlay(this.overlayManager, pairingUrl, 'Dapplets');
            this._popupOverlay.open();
        } else {
            this.overlayManager.toggle();
        }
    }

    public async sendWalletConnectTx(dappletId, metadata, callback: (e: { type: string, data?: any }) => void): Promise<any> {
        const backgroundFunctions = await initBGFunctions(extension);
        const {
            loadDapplet,
            loadDappletFrames,
            transactionCreated,
            transactionRejected,
            checkConnection,
            getGlobalConfig,
            sendLegacyTransaction
        } = backgroundFunctions;

        const isConnected = await checkConnection();

        const me = this;

        if (!isConnected) {
            await this.waitPairingOverlay();
            callback({ type: "PAIRED" });
        }

        let dappletResult = null;

        const { walletInfo } = await getGlobalConfig();

        if (walletInfo.protocolVersion === "0.2.0") {
            console.log("Wallet is Dapplet Frames compatible. Sending Dapplet Frames transaction...");
            dappletResult = await loadDappletFrames(dappletId, metadata);
        } else if (walletInfo.protocolVersion === "0.1.0") {
            console.log("Wallet is Dapplet compatible. Sending Dapplet transaction...");
            dappletResult = await loadDapplet(dappletId, metadata);
        } else {
            console.log("Wallet is Dapplet incompatible. Showing dapplet view...");

            const waitApproving = function (): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    const pairingUrl = extension.extension.getURL('dapplet.html');
                    const overlay = me.overlay(pairingUrl, 'Dapplet');
                    // ToDo: implement multiframe
                    overlay.open(() => overlay.publish('txmeta', dappletId, metadata));
                    // ToDo: add timeout?
                    overlay.subscribe('approved', () => {
                        resolve();
                        overlay.close();
                    });
                    overlay.subscribe('error', () => {
                        reject();
                        overlay.close();
                    });
                });
            };

            await waitApproving();
            dappletResult = await sendLegacyTransaction(dappletId, metadata);
        }

        if (dappletResult) {
            transactionCreated(dappletResult);
            callback({ type: "CREATED", data: dappletResult });
        } else {
            transactionRejected();
            callback({ type: "REJECTED" });
        }

        return dappletResult;
    }
}