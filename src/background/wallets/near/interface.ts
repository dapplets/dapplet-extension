import * as nearAPI from 'near-api-js'
import { GenericWallet } from '../interface'

export interface NearWallet extends GenericWallet {
  sendCustomRequest(method: string, params: any): Promise<any>
  getAccount(): nearAPI.ConnectedWalletAccount
}
