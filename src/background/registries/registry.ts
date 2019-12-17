export interface Registry {
    getVersions(name: string, branch: string): Promise<string[]>;

    resolveToUri(name: string, branch: string, version: string): Promise<string[]>;

    // ToDo: add params limit: number, settings: any
    // no more than 100, order
    getFeatures(hostnames: string[]): Promise<{ [name: string]: string[] }> // returns name + branches
}