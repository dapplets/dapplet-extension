import WalletConnect from "@walletconnect/browser";
import * as ethers from "ethers";
import { DappletConfig } from "../types/dappletConfig";
import { getTxBuilder } from "../utils/dapplets";
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
 * @param {object} txMeta Metadata
 * @returns {Promise<object>} Promise represents transaction result
 */
const loadDapplet = async (dappletId, txMeta) => {
    const request = {
        //id: 1337, // ToDo: generate it
        jsonrpc: "2.0",
        method: "wallet_loadDapplet",
        params: [
            dappletId,
            txMeta
        ]
    };

    const result = await walletConnector.sendCustomRequest(request);
    return result;
};

const sendLegacyTransaction = async (dappletId: string, txMeta: any) => {
    const response = await fetch(`https://dapplets.github.io/dapplet-examples/${dappletId}.json`);
    const dappletConfig: DappletConfig = await response.json();

    for (const txName in dappletConfig.transactions) {
        if (txName) {
            const tx = dappletConfig.transactions[txName];
            const builder = getTxBuilder(tx["@type"]);
            if (builder) {
                const builtTx = builder(tx, txMeta);
                console.log("Sending classic transaction...");
                const result = await walletConnector.sendTransaction({
                    from: walletConnector.accounts[0],
                    to: builtTx.to,
                    data: builtTx.data
                });
                return result;
            }
        }
    }
}

const checkDappletCompatibility = async (): Promise<boolean> => {
    const request = {
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
    getChainId,
    checkDappletCompatibility,
    sendLegacyTransaction
};