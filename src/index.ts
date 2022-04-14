import Core from './contentscript/core';
import { IContentAdapter, IFeature, IResolver, ISharedState } from './contentscript/types';
import { IConnection, Listener } from './contentscript/connection';

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
    ISharedState
}