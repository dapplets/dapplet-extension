import WalletConnect from "@walletconnect/browser";
import * as ethers from "ethers";
import { DappletConfig } from "../types/dappletConfig";
import { ctxToTxMeta as ctxToData } from "../utils/dappletFunctions";
import { promiseTimeout } from "../utils/promiseTimeout";

const bridge = "https://bridge.walletconnect.org";

var walletConnector: WalletConnect;

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
 * @param {object} ctx Metadata
 * @returns {Promise<object>} Promise represents transaction result
 */
const loadDapplet = async (dappletId, ctx) => {
    const request = {
        //id: 1337, // ToDo: generate it
        jsonrpc: "2.0",
        method: "wallet_loadDapplet",
        params: [
            dappletId,
            ctx
        ]
    };

    // ToDo: fix it
    const isDappletCompatibleWallet = await checkDappletCompatibility();

    try {
        if (isDappletCompatibleWallet) {
            console.log("Wallet is Dapplet compatible. Sending Dapplet transaction...");
            const result = await walletConnector.sendCustomRequest(request);
            return result;
        } else {
            console.log("Wallet is Dapplet incompatible. Creating classic transaction...");
            const response = await fetch(`https://dapplets.github.io/dapplet-examples/${dappletId}.json`);
            const dappletConfig: DappletConfig = await response.json();
            const data = ctxToData(ctx, dappletConfig);
            console.log("Sending classic transaction...");
            const result = await walletConnector.sendTransaction({
                from: walletConnector.accounts[0],
                to: dappletConfig.to,
                data: dappletConfig.signature + data.substring(2)
            });
            return result;
        }
    } catch {
        return null;
    }
};

const checkDappletCompatibility = async (): Promise<boolean> => {
    const request = {
        //id: 1337, // ToDo: generate it
        jsonrpc: "2.0",
        method: "wallet_checkDappletCompatibility"
    };

    try {
        const result = await promiseTimeout(1000, walletConnector.sendCustomRequest(request));
        return !!result;
    } catch {
        return false;
    }
}

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

            resolve(payload);
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

export {
    loadDapplet,
    generateUri,
    checkConnection,
    waitPairing,
    disconnect,
    getAccounts,
    getChainId
};