import { GlobalConfig } from '../models/globalConfig'
import BaseBrowserStorage from './baseBrowserStorage'

export default class GlobalConfigBrowserStorage extends BaseBrowserStorage<GlobalConfig> {
  constructor() {
    super(GlobalConfig, 'GlobalConfig')
  }
}
