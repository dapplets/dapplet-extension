import { Signer, ethers } from "ethers";

export interface ExtendedSigner extends Signer {
    isConnected(): boolean;
    connectWallet(): Promise<void>;
    disconnectWallet(): Promise<void>;
    getLastUsage(): string;
    getMeta(): Promise<{
        icon: string;
        name: string;
        description: string;
    } | null>;
    sendTransactionOutHash(transaction: ethers.providers.TransactionRequest): Promise<string>;
    sendCustomRequest(method: string, params: any[]): Promise<any>;
}