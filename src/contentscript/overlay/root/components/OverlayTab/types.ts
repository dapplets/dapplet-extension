import { StorageRef } from '../../../../../common/types'
import { ToolbarTabMenu } from '../../types'
import { ModuleIconProps } from '../ModuleIcon'

export interface OverlayTabProps {
  id?: string
  pinned: boolean
  title: string
  icon: string | StorageRef | React.FC<React.SVGProps<SVGSVGElement>> | ModuleIconProps
  isActiveTab?: boolean
  activeTabMenuId: string
  menus: ToolbarTabMenu[]
  onTabClick: () => void
  onCloseClick: () => void
  onMenuClick: (menu: ToolbarTabMenu) => void
  setOpenWallet?: any
  isOpenWallet?: boolean
  classNameTab?: string
  classNameIcon?: string
  classNameClose?: string
  classNameList?: string
  classNameItem?: string
  navigate?: any
  pathname?: string
  overlays?: any
  onToggleClick?: any
  menuWidgets?: any
  getWigetsConstructor?: any
  mainMenuNavigation?: any
  connectedDescriptors?: any
  selectedWallet?: any
  isToolbar?: boolean
  hasActionHandler?: boolean
}
