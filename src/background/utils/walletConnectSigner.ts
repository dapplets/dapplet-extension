import * as ethers from "ethers";
import { getConnector, sendTransaction } from '../services/walletConnectService';

export class WalletConnectSigner extends ethers.Signer {
    public provider;

    constructor(providerUrl: string) {
        super();
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl, 'rinkeby');
    }

    connect(provider: ethers.ethers.providers.Provider): ethers.ethers.Signer {
        throw new Error("Method not implemented.");
    }

    getAddress(): Promise<string> {
        // ToDo: why does ethers.js call getAddress() when read operation is?
        const walletConnector = getConnector();
        return Promise.resolve(walletConnector.accounts[0] || '0x0000000000000000000000000000000000000000');
    }

    async signMessage(message: ethers.utils.BytesLike): Promise<string> {
        throw new Error("Method not implemented.");
    }    

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        const walletConnector = getConnector();
        transaction.from = walletConnector.accounts[0];
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await sendTransaction(tx as any);
        return this.provider.getTransaction(txHash);
    }
}