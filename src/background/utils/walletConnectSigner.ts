import * as ethers from "ethers";
import { walletConnector, sendTransaction } from '../services/walletConnectService';

export class WalletConnectSigner extends ethers.Signer {
    public provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992');

    getAddress(): Promise<string> {
        // ToDo: why does ethers.js call getAddress() when read operation is?
        return Promise.resolve(walletConnector.accounts[0] || '0x0000000000000000000000000000000000000000');
    }

    signMessage(message: ethers.utils.Arrayish): Promise<string> {
        //let dataToSign: Uint8Array = ethers.utils.hashMessage(message);;
        throw new Error("Method not implemented.");
    }

    async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        transaction.from = walletConnector.accounts[0];
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await sendTransaction(tx as any);
        return await this.provider.getTransaction(txHash);
    }
}