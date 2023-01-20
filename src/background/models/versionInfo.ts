import { ModuleTypes } from '../../common/constants'
import Base from '../../common/models/base'
import { Environments, StorageRef } from '../../common/types'

export default class VersionInfo extends Base {
  getId = () => this.registryUrl + ':' + this.name + '#' + this.branch + '@' + this.version

  registryUrl: string = null
  type: ModuleTypes = null
  name: string = null
  branch: string = null
  version: string = null
  main: StorageRef = null
  dist: StorageRef = null
  dependencies: {
    [name: string]: string
  } = null
  interfaces: {
    [name: string]: string
  } = null
  environment?: Environments = null
  schemaConfig: StorageRef = null
  defaultConfig: StorageRef = null
  overlays: {
    [name: string]: StorageRef
  } = null
  extensionVersion?: string = null
  createdAt?: string = null
  actions?: string = null
}
