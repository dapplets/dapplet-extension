import { StorageRef } from '../../../../background/types/sowaTemplate'
import { ModuleIconProps } from '../components/ModuleIcon'

export type ToolbarTabMenu = {
  id: string
  title: string
  icon: string | StorageRef | React.FC<React.SVGProps<SVGSVGElement>> | ModuleIconProps
  props?: any
  hidden?: boolean
}

export type ToolbarTab = {
  id: string
  pinned: boolean
  title: string
  icon: string | StorageRef | React.FC<React.SVGProps<SVGSVGElement>> | ModuleIconProps
  menus: ToolbarTabMenu[]
}
