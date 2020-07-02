import Core from './inpage/core';
import { IContentAdapter, IFeature, IResolver } from './inpage/types';
import { IConnection, AutoProperty, AutoPropertyConf, Listener } from './inpage/connection';
import { DefaultConfig, SchemaConfig } from './common/types';

declare global {
    export function Injectable(constructor: Function);
    export function Inject(name: string): Function;
    export function Configure(defaultConfig: DefaultConfig, schemaConfig?: SchemaConfig): Function;
    export var Core: Core;
}

export {
    IContentAdapter,
    IFeature,
    IResolver,
    IConnection,
    AutoProperty,
    AutoPropertyConf,
    Listener
}