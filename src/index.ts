import { IContentAdapter, IFeature, IResolver, ISharedState } from './contentscript/types'
import { Core, IEthWallet, INearWallet } from './worker/core'
import { IConnection, Listener } from './worker/core/connection'
import { IEtherneumWallet } from './worker/core/ethereum/types'

declare global {
  export function Injectable(constructor: Function)
  export function Inject(name: string): Function
  export function OnEvent(type: string): Function
  export var Core: Core
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
}
