import Core, { IEthWallet, INearWallet } from './contentscript/core';
import { IContentAdapter, IFeature, IResolver, ISharedState } from './contentscript/types';
import { IConnection, Listener } from './contentscript/connection';
import { IEtherneumWallet } from './contentscript/ethereum/types';
import { ConnectedWalletAccount } from "near-api-js";

declare global {
    export function Injectable(constructor: Function);
    export function Inject(name: string): Function;
    export var Core: Core;
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
    ConnectedWalletAccount
}