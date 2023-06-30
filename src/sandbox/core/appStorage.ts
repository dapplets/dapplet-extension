import VersionInfo from '../../background/models/versionInfo' // ToDo: move VersionInfo to common
import { formatModuleId } from '../../common/helpers'
import { DefaultConfig, Environments, SchemaConfig } from '../../common/types'
import { initBGFunctions } from '../communication'

export class AppStorage {
  private _moduleName: string
  private _environment: Environments

  constructor(
    manifest: VersionInfo,
    private _defaultConfig?: DefaultConfig,
    private _schemaConfig?: SchemaConfig
  ) {
    if (!manifest.name)
      throw new Error(
        `Cannot initialize AppStorage: "name" is required in the module manifest ${formatModuleId(
          manifest
        )}`
      )
    if (!manifest.environment)
      throw new Error(
        `Cannot initialize AppStorage: the current runtime environment is unknown (dev|test|prod) ${formatModuleId(
          manifest
        )}.`
      )
    if (!!manifest.defaultConfig && !_defaultConfig)
      console.error(
        `Cannot load the default configuration of the module ${formatModuleId(manifest)}.`
      )
    if (!!manifest.schemaConfig && !_schemaConfig)
      console.error(
        `Cannot load the default configuration of the module ${formatModuleId(manifest)}.`
      )

    this._moduleName = manifest.name
    this._environment = manifest.environment
  }

  public async get(key: string): Promise<any> {
    const { getUserSettings } = initBGFunctions()
    const value = await getUserSettings(this._moduleName, key)
    return value || (this._defaultConfig && this._defaultConfig[this._environment]?.[key])
  }

  public async set(key: string, value: any): Promise<void> {
    const { setUserSettings } = initBGFunctions()
    return setUserSettings(this._moduleName, key, value)
  }

  public async remove(key: string): Promise<void> {
    const { removeUserSettings } = initBGFunctions()
    return removeUserSettings(this._moduleName, key)
  }

  public async clear(): Promise<void> {
    const { clearUserSettings } = initBGFunctions()
    return clearUserSettings(this._moduleName)
  }
}
