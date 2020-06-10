import Manifest from "../models/manifest";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export type StorageRef = {
    hash: string;
    uris: string[];
}

export interface Registry {
    isAvailable: boolean;
    error: string;
    url: string;

    getModuleInfo(contextIds: string[], users: string[]): Promise<{ [contextId: string]: ModuleInfo[] }>;
    getVersionNumbers(name: string, branch: string): Promise<string[]>;
    getVersionInfo(name: string, branch: string, version: string): Promise<VersionInfo>;
    getAllDevModules(): Promise<{ name: string, branch: string, version: string }[]>;
    addModule(name: string, branch: string, version: string, manifest: Manifest): Promise<void>;
    getOwnership(moduleName: string): Promise<string>;
    transferOwnership(moduleName: string, address: string): Promise<void>;
    addLocation(moduleName: string, location: string): Promise<void>;
    removeLocation(moduleName: string, location: string): Promise<void>;
}