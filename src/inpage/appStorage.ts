import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { Environments, DefaultConfig } from "../common/types";

export class AppStorage {
    constructor(private _moduleName: string, private _environment: Environments, private _defaultConfig?: DefaultConfig) { }

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