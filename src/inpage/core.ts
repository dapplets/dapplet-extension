import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Connection } from './connection';
import { OverlayManager } from "./overlayManager";
import { Overlay, SubscribeOptions } from "./overlay";
import * as extension from 'extensionizer';

export default class Core {

    public overlayManager = new OverlayManager();

    public connect(url: string): Connection {
        return new Connection(url);
    }

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

    public async sendWalletConnectTx(dappletId, metadata): Promise<any> {
        const backgroundFunctions = await initBGFunctions(extension);
        const {
            loadDapplet,
            transactionCreated,
            transactionRejected,
            checkConnection
        } = backgroundFunctions;

        const isConnected = await checkConnection();

        const me = this;

        if (!isConnected) {
            const pairWallet = function (): Promise<void> {
                return new Promise<void>((resolve, reject) => {
                    const pairingUrl = extension.extension.getURL('pairing.html');
                    const overlay = me.overlay(pairingUrl, 'Wallet');
                    overlay.open();
                    // ToDo: add timeout?
                    overlay.subscribe('paired', () => resolve());
                    overlay.subscribe('error', () => reject());
                });
            };

            await pairWallet();
        }

        const dappletResult = await loadDapplet(dappletId, metadata);
        if (dappletResult) {
            transactionCreated(dappletResult);
        } else {
            transactionRejected();
        }

        return dappletResult;
    }
}