import {
  BridgeWallet,
  WalletBehaviourFactory,
  WalletModuleFactory,
} from '@near-wallet-selector/core'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'

export interface WalletParams {
  app: string | DefaultSigners
  chain: ChainTypes.NEAR_MAINNET | ChainTypes.NEAR_TESTNET
}

interface WalletExtraOptions {
  app: string | DefaultSigners
  chain: ChainTypes.NEAR_MAINNET | ChainTypes.NEAR_TESTNET
}

export class WalletImpl {
  constructor(
    public app: string | DefaultSigners,
    public chain: ChainTypes.NEAR_MAINNET | ChainTypes.NEAR_TESTNET
  ) {}

  signIn = async () => {
    return []
  }

  signOut = async () => {
    return initBGFunctions(browser).then((x) => x.near_signOut(this.app, this.chain))
  }

  getAccounts = async () => {
    return initBGFunctions(browser).then((x) => x.near_getAccounts(this.app, this.chain))
  }

  verifyOwner = async () => {
    throw new Error(`Method not supported`)
  }

  signMessage = async () => {
    throw new Error(`Method not supported`)
  }

  signAndSendTransaction = async (params) => {
    return initBGFunctions(browser).then((x) =>
      x.near_signAndSendTransaction(this.app, this.chain, params)
    )
  }

  signAndSendTransactions = async (params) => {
    return initBGFunctions(browser).then((x) =>
      x.near_signAndSendTransactions(this.app, this.chain, params)
    )
  }

  buildImportAccountsUrl = (): string => {
    throw new Error(`Method not supported`)
  }
}

const MyNearWallet: WalletBehaviourFactory<BridgeWallet, { params: WalletExtraOptions }> = async ({
  params,
}) => {
  return new WalletImpl(params.app, params.chain)
}

export function setupWallet({ app, chain }: WalletParams): WalletModuleFactory<BridgeWallet> {
  return async () => {
    return {
      id: 'background',
      type: 'bridge',
      metadata: {
        name: 'background',
        description: 'background',
        available: true,
        iconUrl: '',
        deprecated: false,
        walletUrl: '',
      },
      init: (options) => {
        return MyNearWallet({ ...options, params: { app, chain } })
      },
    }
  }
}
