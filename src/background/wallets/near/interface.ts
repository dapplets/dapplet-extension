import type {
  Account,
  Action,
  SignInParams,
  VerifiedOwner,
  VerifyOwnerParams,
} from '@near-wallet-selector/core'
import * as nearAPI from 'near-api-js'
import { GenericWallet } from '../interface'
import { CustomConnectedWalletAccount } from './near/customConnectedWalletAccount'

export interface BrowserWalletSignInParams extends SignInParams {
  successUrl?: string
  failureUrl?: string
}

export interface SignAndSendTransactionParams {
  signerId?: string
  receiverId?: string
  actions: Array<Action>
}

export interface BrowserWalletSignAndSendTransactionParams extends SignAndSendTransactionParams {
  callbackUrl?: string
}

export interface NearWallet extends GenericWallet {
  sendCustomRequest(method: string, params: any): Promise<any>
  signIn(params: BrowserWalletSignInParams): Promise<Account[]>
  signOut(): Promise<void>
  getAccounts(): Promise<Account[]>
  verifyOwner(params: VerifyOwnerParams): Promise<void | VerifiedOwner>
  signAndSendTransaction(
    params: BrowserWalletSignAndSendTransactionParams
  ): Promise<void | nearAPI.providers.FinalExecutionOutcome>
  signAndSendTransactions(params: any): Promise<void> // ToDo: add types
  buildImportAccountsUrl(): string
  getAccount(): Promise<CustomConnectedWalletAccount>
  createAccessKey(contractId: string, loginConfirmationId: string): Promise<void>
}
