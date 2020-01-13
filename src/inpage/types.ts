export interface IModule { }

export interface IContentAdapter extends IModule {
    attachFeature(feature: IFeature): void;
    detachFeature(feature: IFeature): void;
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