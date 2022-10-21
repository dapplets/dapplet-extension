import cn from 'classnames'
import React, { ReactElement } from 'react'
import { StorageRef } from '../../../../../common/types'
import { StorageRefImage } from '../../components/StorageRefImage'
import { ToolbarTabMenu } from '../../types'
import { ModuleIcon, ModuleIconProps } from '../ModuleIcon'
import styles from './OverlayTab.module.scss'

export interface OverlayTabProps {
  pinned: boolean
  title: string
  icon: string | StorageRef | React.FC<React.SVGProps<SVGSVGElement>> | ModuleIconProps
  isActive: boolean
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
}

export const OverlayTab = (p: OverlayTabProps): ReactElement => {
  const visibleMenus = p.menus.filter((x) => x.hidden !== true)

  const _handleCloseClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    p.onCloseClick()
  }

  return (
    <div
      // onClick={() => {
      //   !p.isActive && p.onTabClick()

      //   // p.setOpenWallet()
      // }}
      className={cn(styles.tab, p.classNameTab, {
        [styles.tabNotActive]: !p.isActive,
        [styles.isOpenWallet]: p.isOpenWallet,
      })}
    >
      <div className={styles.top}>
        {p.icon && typeof p.icon === 'function' ? null : //   onClick={() => { // <p.icon
        //     !p.isActive && p.onTabClick()
        //     // console.log('2');
        //   }}
        //   className={cn(styles.image, {
        //     [styles.cursor]: !p.isActive,
        //   })}
        // />
        p.icon && typeof p.icon === 'object' && 'moduleName' in p.icon ? (
          <ModuleIcon
            onClick={() => {
              !p.isActive && p.onTabClick()
            }}
            className={cn(
              styles.image,
              {
                [styles.cursor]: !p.isActive,
              },
              p.classNameIcon
            )}
            moduleName={p.icon.moduleName}
            registryUrl={p.icon.registryUrl}
          />
        ) : (
          <StorageRefImage
            onClick={() => {
              !p.isActive && p.onTabClick()
            }}
            className={cn(
              styles.image,
              {
                [styles.cursor]: !p.isActive,
              },
              p.classNameIcon
            )}
            storageRef={p.icon as any}
          />
        )}
        {!p.pinned && (
          <span className={cn(styles.close, p.classNameClose)} onClick={_handleCloseClick}>
            {/* <Close /> */}
          </span>
        )}
      </div>

      {
        // p.isActive &&
        p.pinned && visibleMenus.length > 0 && (
          <ul
            className={cn(
              styles.list,
              {
                [styles.listNotPadding]: typeof p.icon === 'function',
              },
              p.classNameList
            )}
          >
            {visibleMenus.map((menu) => {
              return (
                <li
                  key={menu.id}
                  title={menu.title}
                  onClick={() => p.onMenuClick(menu)}
                  className={cn(
                    styles.item,
                    {
                      [styles.selected]: p.activeTabMenuId === menu.id,
                    },
                    p.classNameItem
                  )}
                >
                  {menu.icon && typeof menu.icon === 'function' ? (
                    <menu.icon />
                  ) : menu.icon && typeof menu.icon === 'object' && 'moduleName' in menu.icon ? (
                    <ModuleIcon
                      moduleName={menu.icon.moduleName}
                      registryUrl={menu.icon.registryUrl}
                    />
                  ) : (
                    <StorageRefImage storageRef={menu.icon as any} />
                  )}
                </li>
              )
            })}
          </ul>
        )
      }
    </div>
  )
}
