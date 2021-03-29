import * as ethers from "ethers";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ChainTypes } from "../common/types";

export class ProxySigner extends ethers.Signer {
    public provider = new ethers.providers.Web3Provider((method, params) => initBGFunctions(browser).then(f => f.fetchJsonRpc(method, params)));

    constructor(private _app: string) {
        super();
    }

    connect(provider: ethers.ethers.providers.Provider): ethers.ethers.Signer {
        throw new Error("Method not implemented.");
    }

    async getAddress(): Promise<string> {
        const { getAddress } = await initBGFunctions(browser);
        return getAddress(this._app, ChainTypes.ETHEREUM);
    }

    async signMessage(message: ethers.utils.BytesLike): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        const { eth_sendTransactionOutHash } = await initBGFunctions(browser);
        const txHash = await eth_sendTransactionOutHash(this._app, transaction);
        
        // the wait of a transaction from another provider can be long
        let tx = null;
        while (tx === null) {
            await new Promise((res) => setTimeout(res, 1000));
            tx = await this.provider.getTransaction(txHash);
        }

        return tx;
    }
}