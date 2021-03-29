// import WalletLink, { WalletLinkProvider } from 'walletlink';
// import { Provider, TransactionRequest } from "@ethersproject/providers";
// import { ethers } from "ethers";
// import { Deferrable } from "ethers/lib/utils";
// import { ExtendedSigner } from "../extendedSigner";
// import { browser } from 'webextension-polyfill-ts';
// import { getCurrentTab } from '../../../common/helpers';

// export default class extends ethers.Signer implements ExtendedSigner {

//     public provider = new ethers.providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/e2b99cd257a5468d94749fa32f75fc3c', 'rinkeby');
//     private _walletlink: WalletLink;
//     private _ethereum: WalletLinkProvider;

//     constructor() {
//         super();
//         this._walletlink = new WalletLink({
//             appName: 'Dapplet Extension',
//             appLogoUrl: 'https://dapplets.org/favicon.png',
//             darkMode: false
//         });
//         this._ethereum = this._walletlink.makeWeb3Provider('https://rinkeby.infura.io/v3/e2b99cd257a5468d94749fa32f75fc3c', 4);
//     }

//     async getAddress(): Promise<string> {
//         return Promise.resolve(this._ethereum.selectedAddress || '0x0000000000000000000000000000000000000000');
//     }

//     async signMessage(message: string | ethers.Bytes): Promise<string> {
//         throw new Error('Not implemented');
//     }

//     async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
//         throw new Error('Not implemented');
//     }

//     async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
//         const txHash = await this.sendTransactionOutHash(transaction);
//         return this.provider.getTransaction(txHash);
//     }

//     async sendTransactionOutHash(transaction: ethers.providers.TransactionRequest): Promise<string> {
//         transaction.from = await this.getAddress();
//         const tx = await ethers.utils.resolveProperties(transaction);
//         const txHash = await this._walletlink.sendTransaction(tx as any);
//         localStorage['walletconnect_lastUsage'] = new Date().toISOString();
//         return txHash;
//     }

//     async sendCustomRequest(method: string, params: any[]): Promise<any> {
//         return new Promise((res, rej) => this._ethereum.send(
//             { method, params },
//             ({ result, error }) => (error) ? rej(error) : res(result)
//         );
//     }

//     connect(provider: Provider): ethers.Signer {
//         throw new Error("Method not implemented.");
//     }

//     isConnected() {
//         return this._ethereum.isConnected();
//     }

//     async connectWallet(): Promise<void> {
//         await this._ethereum.send('eth_requestAccounts');
//         localStorage['walletlink_lastUsage'] = new Date().toISOString();
//     }

//     async disconnectWallet() {
//         await this._ethereum.close();
//     }

//     async getMeta() {
//         return null;
//     }

//     getLastUsage() {
//         return localStorage['walletlink_lastUsage'];
//     }

//     // private async _showQR(uri: string) {
//     //     const activeTab = await getCurrentTab();
//     //     const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
//     //         type: "OPEN_PAIRING_OVERLAY",
//     //         payload: {
//     //             topic: 'walletconnect',
//     //             args: [uri]
//     //         }
//     //     });
//     // }
// }