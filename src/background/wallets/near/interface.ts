import { GenericWallet } from "../interface";
import * as nearAPI from 'near-api-js';

export interface NearWallet extends GenericWallet {
    sendCustomRequest(method: string, params: any): Promise<any>;
    getAccount(): nearAPI.ConnectedWalletAccount;
}