import WalletConnect from "@walletconnect/browser";
import { SowaTemplate } from "../types/sowaTemplate";
import { getTxBuilder } from "../../common/sowa";
import { promiseTimeout } from "../utils/promiseTimeout";
import GlobalConfigService from "./globalConfigService";
import { WalletInfo } from '../../common/constants';

const bridge = "https://bridge.walletconnect.org";

var walletConnector: WalletConnect;
const _globalConfigService = new GlobalConfigService();

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
 * Runs SOWA tx inside paired wallet and returns transaction result
 * @async
 * @param {string} sowaId SOWA Template ID
 * @param {object} txMeta Metadata
 * @returns {Promise<object>} Promise represents transaction result
 */
const loadSowa = async (sowaId, txMeta) => {
    const request = {
        jsonrpc: "2.0",
        method: "wallet_loadDapplet",
        params: [
            sowaId,
            txMeta
        ]
    };

    const result = await walletConnector.sendCustomRequest(request);
    return result;
};

const loadSowaFrames = async (sowaId, txMeta) => {
    const request = {
        jsonrpc: "2.0",
        method: "wallet_loadDappletFrames",
        params: [
            [sowaId, txMeta],
            ["2"]
        ]
    };

    const result = await walletConnector.sendCustomRequest(request);
    return result;
};

const sendLegacyTransaction = async (sowaId: string, txMeta: any) => {
    const sowaTemplate = await getSowaTemplate(sowaId);

    for (const txName in sowaTemplate.transactions) {
        if (txName) {
            const tx = sowaTemplate.transactions[txName];
            const builder = getTxBuilder(tx["@type"]);
            if (builder) {
                const builtTx = builder(tx, txMeta);
                console.log("Sending classic transaction...");
                const result = await walletConnector.sendTransaction({
                    from: walletConnector.accounts[0],
                    to: builtTx.to,
                    data: builtTx.data,
                    value: builtTx.value
                });
                return result;
            }
        }
    }
}

const _getWalletInfo = async (): Promise<WalletInfo> => {
    const requests = [{
        method: "wallet_checkDappletFramesCompatibility",
        transform: (data): WalletInfo => ({
            compatible: true,
            protocolVersion: data?.protocolVersion || "0.2.0",
            engineVersion: data?.protocolVersion || "0.2.0",
            device: data?.device
        })
    }, {
        method: "wallet_checkDappletCompatibility",
        transform: (data): WalletInfo => ({
            compatible: true,
            protocolVersion: data?.protocolVersion || "0.1.0",
            engineVersion: data?.protocolVersion || "0.1.0",
            device: data?.device
        })
    }];

    for (const request of requests) {
        try {
            const result = await promiseTimeout(1000, walletConnector.sendCustomRequest({
                jsonrpc: "2.0",
                method: request.method
            }));

            if (!result) continue;

            return request.transform(result);
        } catch {}
    }

    return {
        compatible: false,
        protocolVersion: null,
        engineVersion: null,
        device: null
    }
}


const disconnect = () => {
    walletConnector.killSession();
    localStorage.clear();
    walletConnector = null;
    walletConnector = new WalletConnect({
        bridge
    });
    // ToDo: clear globalconfig.dappletCompatibility
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
const waitPairing = async () => {
    const result: any = await _waitWCPairing();
    
    if (result) {
        const config = await _globalConfigService.get();
        config.walletInfo = await _getWalletInfo();
        await _globalConfigService.set(config);
    }

    return result;
};

const _waitWCPairing = () => {
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

const getSowaTemplate = async (sowaId: string) => {
    const response = await fetch(`https://dapplets.github.io/dapplet-examples/${sowaId}.json`);
    const dappletConfig: SowaTemplate = await response.json();
    return dappletConfig;
}

export {
    loadSowa,
    loadSowaFrames,
    generateUri,
    checkConnection,
    waitPairing,
    disconnect,
    getAccounts,
    getChainId,
    sendLegacyTransaction,
    getSowaTemplate
};