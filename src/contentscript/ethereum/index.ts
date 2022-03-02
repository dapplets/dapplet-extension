import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ethers } from "ethers";
import { browser } from "webextension-polyfill-ts";
import { Connection, EventDef } from "../connection";
import { ProxySigner } from "../proxySigner";

// ToDo: use sendSowaTransaction method from background
async function _sendWalletConnectTx(app: string, sowaIdOrRpcMethod, sowaMetadataOrRpcParams, callback: (e: { type: string, data?: any }) => void): Promise<any> {
    const { eth_sendCustomRequest, eth_waitTransaction } = await initBGFunctions(browser);

    callback({ type: "pending" });

    try {
        const txHash = await eth_sendCustomRequest(app, sowaIdOrRpcMethod, sowaMetadataOrRpcParams);
        if (typeof txHash === 'string' && txHash.startsWith('0x') && txHash.length === 66) {
            callback({ type: "result", data: txHash });
            callback({ type: "created", data: txHash });
            const tx = await eth_waitTransaction(app, txHash);
            callback({ type: "mined", data: tx });
        } else {
            callback({ type: "result", data: txHash });
        }
    } catch (err) {
        console.error(err);
        callback({ type: "rejected", data: err });
    }
}

export async function createWalletConnection<M, T>(app: string, cfg: { network: string }, eventDef?: EventDef<any>) {
    const transport = {
        _txCount: 0,
        _handler: null,
        exec: (sowaIdOrRpcMethod: string, sowaMetadataOrRpcParams: any) => {
            const id = (++transport._txCount).toString();
            _sendWalletConnectTx(app, sowaIdOrRpcMethod, sowaMetadataOrRpcParams, (e) => transport._handler(id, e));
            return Promise.resolve(id);
        },
        onMessage: (handler: (topic: string, message: any) => void) => {
            transport._handler = handler;
            return {
                off: () => transport._handler = null
            }
        }
    }

    const conn = Connection.create<M, T>(transport, eventDef);
    return conn;
}

export async function createContractWrapper(app: string, cfg: { network: string }, address: string, options: any) {
    const signer = new ProxySigner(app);
    return new ethers.Contract(address, options, signer);
}