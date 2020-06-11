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
    getAllDevModules(): Promise<{ module: ModuleInfo, versions: VersionInfo[] }[]>;
    addModule(module: ModuleInfo, version: VersionInfo): Promise<void>;
    getOwnership(moduleName: string): Promise<string>;
    transferOwnership(moduleName: string, address: string): Promise<void>;
    addContextId(moduleName: string, contextId: string): Promise<void>;
    removeContextId(moduleName: string, contextId: string): Promise<void>;
}