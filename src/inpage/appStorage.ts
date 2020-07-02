import { initBGFunctions } from "chrome-extension-message-wrapper";
import * as extension from 'extensionizer';
import { Environments, DefaultConfig } from "../common/types";

export class AppStorage {
    public defaultConfig: DefaultConfig;

    constructor(private _moduleName: string, private _environment: Environments) { }

    public async get(key: string): Promise<any> {
        const { getUserSettings } = await initBGFunctions(extension);
        const value = await getUserSettings(this._moduleName, key);
        return value || (this.defaultConfig && this.defaultConfig[this._environment]?.[key]);
    }

    public async set(key: string, value: any): Promise<void> {
        const { setUserSettings } = await initBGFunctions(extension);
        return await setUserSettings(this._moduleName, key, value);
    }

    public async remove(key: string): Promise<void> {
        const { removeUserSettings } = await initBGFunctions(extension);
        return await removeUserSettings(this._moduleName, key);
    }

    public async clear(): Promise<void> {
        const { clearUserSettings } = await initBGFunctions(extension);
        return await clearUserSettings(this._moduleName);
    }
}