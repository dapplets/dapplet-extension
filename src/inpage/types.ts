export interface IModule { }

export interface IContentAdapter extends IModule {
    attachFeature(feature: IFeature): void;
    detachFeature(feature: IFeature): void;
    onContextCreated(handler: (ctx?: any, type?: string) => void): void;
    onContextDestroyed(handler: (ctx?: any, type?: string) => void): void;
}

export interface IFeature extends IModule {
    contextIds?: string[];
    orderIndex?: number;

    config: any;
    activate(): void;
    deactivate(): void;
}

export interface IResolver extends IModule {
    getBranch(): string;
}

export interface IPubSub {
    exec(method: string, params: any[]): Promise<any>;
    notify(method: string, params: any[]): void;
    on(method: string, handler: (params: any | any[]) => any): {
        off: () => void;
    };
}