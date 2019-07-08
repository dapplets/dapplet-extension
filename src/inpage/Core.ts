import { initBGFunctions } from "chrome-extension-message-wrapper";
import { Connection } from './Connection';
import { OverlayManager } from "./overlayManager";
import { Overlay } from "./overlay";

export default class Core {

    public overlayManager = new OverlayManager();

    public connect(url: string): Connection {
        return new Connection(url);
    }

    public overlay(url: string, title: string) {
        const overlay = new Overlay(this.overlayManager, url, title);
        const me = {
            open: () => (overlay.open(), me),
            close: () => (overlay.close(), me),
            subscribe: (handler) => (overlay.subscribe(handler), me),
            publish: (msg) => (overlay.publish(msg), me)
        };
        return me;
    }

    public async sendWalletConnectTx(dappletId, metadata): Promise<any> {
        const backgroundFunctions = await initBGFunctions(chrome);
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
                    const pairingUrl = chrome.extension.getURL('pairing.html');
                    const overlay = me.overlay(pairingUrl, 'Wallet');
                    overlay.open();
                    // ToDo: add timeout?
                    overlay.subscribe((msg) => {
                        console.log('msg', msg);
                        if (msg == 'paired') {
                            resolve();
                        } else {
                            reject();
                        }
                    });
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