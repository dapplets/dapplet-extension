import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useRef } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { DAPPLETS_STORE_URL } from '../../../../../common/constants'
import { StorageRef } from '../../../../../common/types'
import { ReactComponent as Help } from '../../assets/icons/iconsWidgetButton/help.svg'
import { ReactComponent as Pause } from '../../assets/icons/iconsWidgetButton/pause.svg'
import { ReactComponent as Store } from '../../assets/icons/iconsWidgetButton/store.svg'
import { StorageRefImage } from '../../components/StorageRefImage'
import { useToggle } from '../../hooks/useToggle'
import { ToolbarTabMenu } from '../../types'
import { ModuleIcon, ModuleIconProps } from '../ModuleIcon'
import { SquaredButton } from '../SquaredButton'
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
  tabId?: string
  modules?: any
  navigate?: any
  pathname?: string
  overlays?: any
  onToggleClick?: any
  menuWidgets?: any
  getWigetsConstructor?: any
}

export const OverlayTab = (p: OverlayTabProps): ReactElement => {
  const visibleMenus = p.menus.filter((x) => x.hidden !== true)
  const [menuVisible, setMenuVisible] = useToggle(false)
  const nodeVisibleMenu = useRef<HTMLDivElement>()
  // useEffect(() => {}, [nodeVisibleMenu])
  const onOpenDappletAction = async (f: string) => {
    if (!p.modules) return
    let isModuleActive
    p.modules
      .filter((x) => x.name === f)
      .map((x) => {
        if (x.isActionHandler) return (isModuleActive = true)
        else {
          isModuleActive = false
        }
      })

    const isOverlayActive = p.overlays.find((x) => x.source === f)

    if (isModuleActive) {
      if ((p.pathname.includes('system') && p.overlays.lenght === 0) || !isOverlayActive) {
        try {
          const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
          const tab = await getCurrentTab()
          if (!tab) return
          await openDappletAction(f, tab.id)
          if (
            document
              .querySelector('#dapplets-overlay-manager')
              .classList.contains('dapplets-overlay-collapsed')
          ) {
            p.onToggleClick()
          }
        } catch (err) {
          console.error(err)
        }
      } else {
        p.overlays.filter((x) => x.source === f).map((x) => p.navigate!(`/${f}/${x.id}`))
        if (
          document
            .querySelector('#dapplets-overlay-manager')
            .classList.contains('dapplets-overlay-collapsed')
        ) {
          p.onToggleClick()
        }
      }
    } else {
      p.onTabClick()
      if (
        document
          .querySelector('#dapplets-overlay-manager')
          .classList.contains('dapplets-overlay-collapsed')
      ) {
        p.onToggleClick()
      }
    }
  }
  const onOpenStore = async (f: string) => {
    const url = `${DAPPLETS_STORE_URL}/#searchQuery=${f}`
    window.open(url, '_blank')
  }
  return (
    <div
      tabIndex={0}
      onBlur={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (
          document
            .querySelector('#dapplets-overlay-manager')
            .classList.contains('dapplets-overlay-collapsed')
        ) {
          e.relatedTarget?.hasAttribute('data-visible') ? null : setMenuVisible()
        } else {
          menuVisible && setMenuVisible()
        }
      }}
      onClick={(e) => {
        // !p.isActive && p.onTabClick()
        e.preventDefault()
        e.stopPropagation()
        if (
          document
            .querySelector('#dapplets-overlay-manager')
            .classList.contains('dapplets-overlay-collapsed')
        ) {
          p.pinned && visibleMenus.length > 0 && visibleMenus.map((menu) => p.onMenuClick(menu))
        } else {
          p.pinned && visibleMenus.length > 0 && visibleMenus.map((menu) => p.onMenuClick(menu))

          menuVisible && setMenuVisible()
          onOpenDappletAction(p.tabId)
        }
        // p.setOpenWallet()
      }}
      className={cn(styles.tab, p.classNameTab, {
        [styles.tabNotActive]: !p.isActive,
        // [styles.menuWidgets]: !p.pinned && menuVisible
        // [styles.isOpenWallet]: p.isOpenWallet,
      })}
    >
      {!p.pinned &&
        menuVisible &&
        document
          .querySelector('#dapplets-overlay-manager')
          .classList.contains('dapplets-overlay-collapsed') && (
          <div ref={nodeVisibleMenu} className={styles.menuWidgets}>
            {p.getWigetsConstructor(p.menuWidgets, true)}
            <div className={styles.delimeterMenuWidgets}></div>
            <div className={styles.blockStandartFunction}>
              <SquaredButton
                style={{ cursor: 'auto' }}
                className={styles.squaredButtonMenuWidget}
                data-visible
                disabled={true}
                appearance={'big'}
                icon={Help}
              />
              <SquaredButton
                className={styles.squaredButtonMenuWidget}
                data-visible
                appearance={'big'}
                icon={Store}
                onClick={() => onOpenStore(p.tabId)}
              />
              <SquaredButton
                style={{ cursor: 'auto' }}
                className={styles.squaredButtonMenuWidget}
                data-visible
                disabled={true}
                appearance={'big'}
                icon={Pause}
              />
            </div>
          </div>
        )}
      <div className={styles.top}>
        {p.icon && typeof p.icon === 'function' ? null : p.icon && // /> //   })} //     [styles.cursor]: !p.isActive, //   className={cn(styles.image, { //   }} //     !p.isActive && p.onTabClick() //   onClick={() => { // <p.icon
          typeof p.icon === 'object' &&
          'moduleName' in p.icon ? (
          <ModuleIcon
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('dapplets-overlay-collapsed')
                ? setMenuVisible()
                : onOpenDappletAction(p.tabId) && (menuVisible ? setMenuVisible() : null)
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('dapplets-overlay-collapsed')
                ? setMenuVisible()
                : onOpenDappletAction(p.tabId) && (menuVisible ? setMenuVisible() : null)
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
        {/* {!p.pinned && (
          <span className={cn(styles.close, p.classNameClose)} onClick={_handleCloseClick}>
            <Close />
          </span>
        )} */}
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
                  data-testid={`system-tab-${menu.title}`}
                  key={menu.id}
                  title={menu.title}
                  // onClick={() => {

                  //   p.onMenuClick(menu)
                  // }}
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
