import WalletConnect from "@dapplet-base/walletconnect-browser";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { svgObject } from "qr-image";
import * as NotificationService from './notificationService';

const bridge = "https://bridge.walletconnect.org";

var walletConnector;

try {
    walletConnector = new WalletConnect({
        bridge
    });
    walletConnector.on("disconnect", (error, payload) => {
        if (error) {
            throw error;
        }

        localStorage.clear();
        console.log("wallet disconnected, localstorage cleaned"); // tslint:disable-line
    });
} catch (ex) {
    console.error("WalletConnect initialization error", ex);
}

/**
 * Runs Dapplet inside paired wallet and returns transaction result
 * @async
 * @param {string} dappletId Dapplet ID
 * @param {object} metaTx Metadata
 * @returns {Promise<object>} Promise represents transaction result
 */
const loadDapplet = async (dappletId, metaTx) => {
    try {
        const result = await walletConnector.loadDapplet(dappletId, metaTx);
        return result;
    } catch (ex) {
        console.error('loadDapplet', ex);
        return null;
    }
};

const disconnect = () => {
    walletConnector.killSession();
    localStorage.clear();
    walletConnector = null;
    walletConnector = new WalletConnect({
        bridge
    });
};

/**
 * Returns URI of WalletConnect's session
 * @async
 * @returns {Promise<string>} Promise represents session URI
 */
const generateUri = async () => {
    disconnect();
    await walletConnector.createSession();
    const uri = walletConnector.uri;
    return uri;
};

/**
 * Returns connection status of WalletConnect
 * @returns {boolean} Is connected?
 */
const checkConnection = () => {
    console.log("walletConnector", walletConnector);
    return walletConnector.connected;
};

/**
 * Returns pairing result.
 * @async
 * @returns {Promise<object>} Promise object represents the result of WalletConnect pairing
 */
const waitPairing = () => {
    var promise = new Promise(function (resolve, reject) {
        walletConnector.on("connect", (error, payload) => {
            if (error) {
                reject(error);
            }

            resolve(true);
        });
    });

    return promise;
};

const getAccounts = () => {
    return walletConnector.accounts;
};

const getChainId = () => {
    return walletConnector.chainId;
};

const sendWalletConnectTx = async (dappletId, metadata) => {
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

    //     const img = svgObject(uri, {
    //         type: 'svg'
    //     });
    //     console.log({
    //         img
    //     });

    //     chrome.windows.create({
    //         url: 'popup.html', 
    //         type: 'popup',
    //         width: 320,
    //         height: 320,
    //         focused: true
    //     });
          

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
    //     NotificationService.transactionCreated(dappletResult);
    // } else {
    //     NotificationService.transactionRejected();
    // }

    // return dappletResult;
};

export {
    loadDapplet,
    generateUri,
    checkConnection,
    waitPairing,
    disconnect,
    getAccounts,
    getChainId,
    sendWalletConnectTx
};