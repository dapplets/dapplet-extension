import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import VersionInfo from "../background/models/versionInfo";
import { formatModuleId } from "../common/helpers";
import { Environments, DefaultConfig, SchemaConfig } from "../common/types";

export class AppStorage {
    
    private _moduleName: string;
    private _environment: Environments;

    constructor(manifest: VersionInfo, private _defaultConfig?: DefaultConfig, private _schemaConfig?: SchemaConfig) { 
        if (!manifest.name) throw new Error(`Cannot initialize AppStorage: "name" is required in the module manifest ${formatModuleId(manifest)}`);
        if (!manifest.environment) throw new Error(`Cannot initialize AppStorage: the current runtime environment is unknown (dev|test|prod) ${formatModuleId(manifest)}.`);
        if (!!manifest.defaultConfig && !_defaultConfig) console.error(`Cannot load the default configuration of the module ${formatModuleId(manifest)}.`);
        if (!!manifest.schemaConfig && !_schemaConfig) console.error(`Cannot load the default configuration of the module ${formatModuleId(manifest)}.`);

        this._moduleName = manifest.name;
        this._environment = manifest.environment;
    }

    public async get(key: string): Promise<any> {
        const { getUserSettings } = await initBGFunctions(browser);
        const value = await getUserSettings(this._moduleName, key);
        return value || (this._defaultConfig && this._defaultConfig[this._environment]?.[key]);
    }

    public async set(key: string, value: any): Promise<void> {
        const { setUserSettings } = await initBGFunctions(browser);
        return setUserSettings(this._moduleName, key, value);
    }

    public async remove(key: string): Promise<void> {
        const { removeUserSettings } = await initBGFunctions(browser);
        return removeUserSettings(this._moduleName, key);
    }

    public async clear(): Promise<void> {
        const { clearUserSettings } = await initBGFunctions(browser);
        return clearUserSettings(this._moduleName);
    }
}