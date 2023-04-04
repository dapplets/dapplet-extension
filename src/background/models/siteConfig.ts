import Base from '../../common/models/base'
import { DappletRuntimeResult } from '../../common/types'

// ToDo: It should be UserConfig
export default class SiteConfig extends Base {
  getId = () => this.hostname

  hostname: string = null

  activeFeatures: {
    [name: string]: {
      version: string
      isActive: boolean
      order: number
      runtime: DappletRuntimeResult
      registryUrl: string
    }
  } = {}

  paused: boolean = null
}
