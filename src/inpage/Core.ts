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

    // ToDo: implement
    public async sendWalletConnectTx(dappletId, metadata): Promise<any> {

        const pairingUrl = chrome.extension.getURL('pairing.html');
        const overlay = this.overlay(pairingUrl, 'Wallet');
        overlay.open();

        return null;
        // const backgroundFunctions = await initBGFunctions(chrome);
        // const { sendWalletConnectTx } = backgroundFunctions;
        // const result = await sendWalletConnectTx(dappletId, metadata);
        // return result;


        // var backgroundFunctions = await initBGFunctions(chrome);
        // const {
        //     loadDapplet,
        //     generateUri,
        //     checkConnection,
        //     waitPairing,
        //     transactionCreated,
        //     transactionRejected
        // } = backgroundFunctions;

        // var connected = await checkConnection();

        // // ToDo: we shouldn't call console.log() directly, because need an opportunity to disable logging (only for dev)
        // console.log("connected", connected);

        // console.log(0);
        // if (!connected) {
        //     console.log(1);
        //     var uri = await generateUri();
        //     console.log(2);
        //     console.log("uri", uri);
        //     console.log(3);

        //     const img = svgObject(uri, { type: 'svg' });
        //     console.log({img});

        //     // ToDo: encode uri like QR-code and show its inside popup.
        //     // example below
        //     // wc:dac6c612-859b-48e1-a2ea-f9ba45c622bd@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=3d91e9168f42953eb01253e80d6857eed938817e380c41c87f0b68db1bc3f1a7

        //     WalletConnectQRCodeModal.open(uri, {});
        //     console.log(4);
        //     var result = await waitPairing();
        //     console.log(5);
        //     console.log("result", result);
        //     console.log(6);
        //     WalletConnectQRCodeModal.close();
        //     console.log(7);

        //     if (!result) {
        //         alert("Wallet paring failed");
        //         return;
        //     }
        // }
        // console.log(8);

        // const dappletResult = await loadDapplet(dappletId, metadata);
        // console.log(9);
        // console.log("dappletResult", dappletResult);

        // if (dappletResult) {
        //     transactionCreated(dappletResult);
        // } else {
        //     transactionRejected();
        // }

        // return dappletResult;
    }
}