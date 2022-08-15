import cn from 'classnames'
import React, { ReactElement } from 'react'
import { StorageRef } from '../../../../../background/types/sowaTemplate'
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
  setOpenWallet: any
  isOpenWallet: boolean
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
      onClick={() => {
        !p.isActive && p.onTabClick()

        p.setOpenWallet()
      }}
      className={cn(styles.tab, {
        [styles.tabNotActive]: !p.isActive,
        [styles.isOpenWallet]: p.isOpenWallet,
      })}
    >
      <div className={styles.top}>
        {p.icon && typeof p.icon === 'function' ? (
          <p.icon
            onClick={() => {
              // !p.isActive && p.onTabClick()
            }}
            className={cn(styles.image, {
              [styles.cursor]: !p.isActive,
            })}
          />
        ) : p.icon && typeof p.icon === 'object' && 'moduleName' in p.icon ? (
          <ModuleIcon
            onClick={() => {
              // !p.isActive && p.onTabClick()
            }}
            className={cn(styles.image, {
              [styles.cursor]: !p.isActive,
            })}
            moduleName={p.icon.moduleName}
            registryUrl={p.icon.registryUrl}
          />
        ) : (
          <StorageRefImage
            onClick={() => {
              // !p.isActive && p.onTabClick()
            }}
            className={cn(styles.image, {
              [styles.cursor]: !p.isActive,
            })}
            storageRef={p.icon as any}
          />
        )}
        {!p.pinned && (
          <span className={styles.close} onClick={_handleCloseClick}>
            {/* <Close /> */}
          </span>
        )}
      </div>

      {p.isActive && visibleMenus.length > 0 && (
        <ul className={styles.list}>
          {visibleMenus.map((menu) => {
            return (
              <li
                key={menu.id}
                title={menu.title}
                onClick={() => p.onMenuClick(menu)}
                className={cn(styles.item, {
                  [styles.selected]: p.activeTabMenuId === menu.id,
                })}
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
      )}
    </div>
  )
}
