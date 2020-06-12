import * as ethers from "ethers";
import { walletConnector, sendTransaction } from '../services/walletConnectService';

export class WalletConnectSigner extends ethers.Signer {
    //public provider = new ethers.providers.JsonRpcProvider('http://192.168.100.150:8545');
    // public provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    public provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/eda881d858ae4a25b2dfbbd0b4629992', 'rinkeby');
    //public provider = new ethers.providers.WebSocketProvider('wss://rinkeby.infura.io/ws/v3/eda881d858ae4a25b2dfbbd0b4629992', 'rinkeby');

    connect(provider: ethers.ethers.providers.Provider): ethers.ethers.Signer {
        throw new Error("Method not implemented.");
    }

    getAddress(): Promise<string> {
        // ToDo: why does ethers.js call getAddress() when read operation is?
        return Promise.resolve(walletConnector.accounts[0] || '0x0000000000000000000000000000000000000000');
    }

    async signMessage(message: ethers.utils.BytesLike): Promise<string> {
        throw new Error("Method not implemented.");
    }    

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        transaction.from = walletConnector.accounts[0];
        const tx = await ethers.utils.resolveProperties(transaction);
        const txHash = await sendTransaction(tx as any);
        return await this.provider.getTransaction(txHash);
    }
}