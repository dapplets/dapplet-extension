import { ConnectedWalletAccount } from 'near-api-js'
import ConnectedAccounts from './contentscript/conn-accounts'
import { IConnection, Listener } from './contentscript/connection'
import Core, { IEthWallet, INearWallet } from './contentscript/core'
import { IEtherneumWallet } from './contentscript/ethereum/types'
import { IContentAdapter, IFeature, IResolver, ISharedState } from './contentscript/types'

declare global {
  export function Injectable(constructor: Function)
  export function Inject(name: string): Function
  export var Core: Core
  export var ConnectedAccounts: ConnectedAccounts
}

export {
  IContentAdapter,
  IFeature,
  IResolver,
  IConnection,
  Listener,
  ISharedState,
  IEthWallet,
  INearWallet,
  IEtherneumWallet,
  ConnectedWalletAccount,
}
