import { ModuleTypes } from '../../common/constants'
import Base from '../../common/models/base'
import { StorageRef } from '../registries/registry'

export default class Manifest extends Base {
  getId = () => `${this.name}#${this.branch}@${this.version}`

  name: string = null
  branch: string = null
  version: string = null
  type: ModuleTypes = null
  title: string = null
  description: string = null
  author: string = null
  icon: StorageRef = null
  dist: StorageRef = null

  dependencies: {
    [name: string]: string
  }
}
