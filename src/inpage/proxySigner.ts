import * as ethers from "ethers";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";

export class ProxySigner extends ethers.Signer {
    public provider = new ethers.providers.Web3Provider((method, params) => initBGFunctions(browser).then(f => f.fetchJsonRpc(method, params)));

    connect(provider: ethers.ethers.providers.Provider): ethers.ethers.Signer {
        throw new Error("Method not implemented.");
    }

    async getAddress(): Promise<string> {
        const { getAccounts } = await initBGFunctions(browser);
        return getAccounts().then(addresses => addresses[0] || '0x0000000000000000000000000000000000000000');
    }

    async signMessage(message: ethers.utils.BytesLike): Promise<string> {
        throw new Error("Method not implemented.");
    }    

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        const { sendTransaction } = await initBGFunctions(browser);
        transaction.from = await this.getAddress();
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await sendTransaction(tx as any);
        return this.provider.getTransaction(txHash);
    }
}