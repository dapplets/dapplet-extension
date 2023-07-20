import { IConnection, Listener } from './contentscript/connection'
import { IEthWallet, INearWallet } from './contentscript/core'
import { IEtherneumWallet } from './contentscript/ethereum/types'
import { IContentAdapter, IFeature, IResolver, ISharedState } from './contentscript/types'
import { Core } from './worker/core'

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
