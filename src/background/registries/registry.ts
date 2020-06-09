import Manifest from "../models/manifest";
import ModuleInfo from "../models/moduleInfo";

export type StorageRef = {
    hash: string;
    uris: string[];
}

export interface Registry {
    isAvailable: boolean;
    error: string;
    url: string;

    getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }>;

    getVersions(name: string, branch: string): Promise<string[]>;

    resolveToManifest(name: string, branch: string, version: string): Promise<Manifest>;

    // ToDo: add params limit: number, settings: any
    // no more than 100, order
    getFeatures(hostnames: string[]): Promise<{ [hostname: string]: { [name: string]: string[]; } }> // returns name + branches

    getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]>;

    addModule(name: string, branch: string, version: string, manifest: Manifest): Promise<void>;

    hashToUris(hash: string): Promise<StorageRef>;

    getOwnership(moduleName: string): Promise<string>;

    transferOwnership(moduleName: string, address: string): Promise<void>;

    addLocation(moduleName: string, location: string): Promise<void>;

    removeLocation(moduleName: string, location: string): Promise<void>;
}