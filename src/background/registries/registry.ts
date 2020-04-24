export type HashUris = {
    hash: string;
    uris: string[];
}

export interface Registry {
    isAvailable: boolean;
    error: string;
    url: string;

    getVersions(name: string, branch: string): Promise<string[]>;

    resolveToUris(name: string, branch: string, version: string): Promise<HashUris>;

    // ToDo: add params limit: number, settings: any
    // no more than 100, order
    getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> // returns name + branches

    getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]>;

    addModuleWithObjects(name: string, branch: string, version: string, hashUris: HashUris[], key?: string): Promise<void>;

    hashToUris(hash: string): Promise<HashUris>;
}