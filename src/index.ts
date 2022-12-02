import { IConnection, Listener } from './contentscript/connection'
import Core, { IEthWallet, INearWallet } from './contentscript/core'
import { IEtherneumWallet } from './contentscript/ethereum/types'
import { IContentAdapter, IFeature, IResolver, ISharedState,IOverlayAdapter } from './contentscript/types'

declare global {
  export function Injectable(constructor: Function, name?:string)
  export function Inject(name: string): Function
  export var Core: Core
}

export {
  IOverlayAdapter,
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
