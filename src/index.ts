import Core from './inpage/core';
import { IContentAdapter, IFeature, IResolver } from './inpage/types';
import { IConnection, AutoProperty, Listener } from './inpage/connection';

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
    AutoProperty,
    Listener
}