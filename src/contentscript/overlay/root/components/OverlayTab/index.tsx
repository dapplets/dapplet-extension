import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { DAPPLETS_STORE_URL } from '../../../../../common/constants'
import { DefaultSigners, StorageRef } from '../../../../../common/types'
import { ReactComponent as Account } from '../../assets/icons/iconsWidgetButton/account.svg'
import { ReactComponent as Help } from '../../assets/icons/iconsWidgetButton/help.svg'
import { ReactComponent as Login } from '../../assets/icons/iconsWidgetButton/login.svg'
import { ReactComponent as Max } from '../../assets/icons/iconsWidgetButton/max.svg'
import { ReactComponent as Notification } from '../../assets/icons/iconsWidgetButton/notification.svg'
import { ReactComponent as Pause } from '../../assets/icons/iconsWidgetButton/pause.svg'
import { ReactComponent as Store } from '../../assets/icons/iconsWidgetButton/store.svg'
import { StorageRefImage } from '../../components/StorageRefImage'
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
  mainMenuNavigation?: any
  connectedDescriptors?: any
  selectedWallet?: any
  isToolbar?: boolean
}

export const OverlayTab = (p: OverlayTabProps): ReactElement => {
  const visibleMenus = p.menus.filter((x) => x.hidden !== true)
  const nodeVisibleMenu = useRef<HTMLDivElement>()
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    !document
      .querySelector('#dapplets-overlay-manager')
      .classList.contains('dapplets-overlay-collapsed') && setMenuVisible(false)
  }, [menuVisible])

  const connectWallet = async () => {
    const { pairWalletViaOverlay } = await initBGFunctions(browser)
    try {
      await pairWalletViaOverlay(null, DefaultSigners.EXTENSION, null)
      p.setOpenWallet()
    } catch (error) {
    } finally {
    }
  }
  const getIconSelectedWallet = () => {
    if (p.selectedWallet) {
      const newIcon =
        p.connectedDescriptors &&
        p.connectedDescriptors.length > 0 &&
        p.connectedDescriptors.filter((x) => x.type === p.selectedWallet)

      const iconLogin =
        newIcon && newIcon[0]?.account && makeBlockie(newIcon[0]?.account.toLowerCase())
      return iconLogin
    } else null
  }

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
      data-testid={!p.pinned ? 'tab-not-pinned' : 'tab-pinned'}
      tabIndex={0}
      onBlur={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (
          document
            .querySelector('#dapplets-overlay-manager')
            .classList.contains('dapplets-overlay-collapsed')
        ) {
          e.relatedTarget?.hasAttribute('data-visible') && menuVisible
            ? null
            : setMenuVisible(false)
        } else {
          setMenuVisible(false)
        }
      }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()

        if (
          document
            .querySelector('#dapplets-overlay-manager')
            .classList.contains('dapplets-overlay-collapsed')
        ) {
          setMenuVisible(!menuVisible)
        } else {
          onOpenDappletAction(p.tabId) && setMenuVisible(false)
        }
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
                  data-testid={`system-tab-${menu.title.toLowerCase()}`}
                  key={menu.id}
                  title={menu.title}
                  onClick={(e) => {
                    e.preventDefault
                    e.stopPropagation()

                    if (
                      document
                        .querySelector('#dapplets-overlay-manager')
                        .classList.contains('dapplets-overlay-collapsed')
                    ) {
                      menu.id === 'dapplets' && setMenuVisible(!menuVisible)

                      p.onToggleClick()

                      // menuVisible && setMenuVisible()
                    } else {
                      if (menu.id === 'dapplets') {
                        if (p.pathname === '/system/dapplets') {
                          p.onToggleClick()
                        } else {
                          p.navigate('/system/dapplets')
                        }
                      } else {
                        p.pinned &&
                          visibleMenus.length > 0 &&
                          visibleMenus.map((menu) => p.onMenuClick(menu))

                        setMenuVisible(false)
                        onOpenDappletAction(p.tabId)
                      }
                    }
                  }}
                  className={cn(
                    styles.item,
                    {
                      [styles.selected]: p.activeTabMenuId === menu.id,
                    },
                    p.classNameItem
                  )}
                >
                  {menu.id === 'connectedAccounts' ? (
                    menu.icon && typeof menu.icon === 'function' ? (
                      p.selectedWallet && p.isToolbar ? (
                        <StorageRefImage storageRef={getIconSelectedWallet() as any} />
                      ) : (
                        <menu.icon />
                      )
                    ) : menu.icon && typeof menu.icon === 'object' && 'moduleName' in menu.icon ? (
                      <ModuleIcon
                        moduleName={menu.icon.moduleName}
                        registryUrl={menu.icon.registryUrl}
                      />
                    ) : (
                      <StorageRefImage storageRef={menu.icon as any} />
                    )
                  ) : menu.icon && typeof menu.icon === 'function' ? (
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
            {p.pinned &&
              menuVisible &&
              document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('dapplets-overlay-collapsed') && (
                <ul data-testid="main-menu-actions" className={styles.mainMenu}>
                  <li onClick={connectWallet} className={styles.mainMenuItem}>
                    <span className={styles.mainMenuItemTitle}>Log in to extension</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Login />
                    </span>
                  </li>
                  <li
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      p.navigate(`/system/connectedAccounts`)
                      p.onToggleClick()
                      setMenuVisible(false)
                    }}
                    className={styles.mainMenuItem}
                  >
                    <span className={styles.mainMenuItemTitle}>Connected Accounts</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Account />
                    </span>
                  </li>
                  <li
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      p.onToggleClick()
                      p.navigate(`/system/notifications`)

                      setMenuVisible(false)
                    }}
                    className={styles.mainMenuItem}
                  >
                    <span className={styles.mainMenuItemTitle}>Notifications</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Notification />
                    </span>
                  </li>
                  {/* <li className={styles.mainMenuItem}>
                    <span className={styles.mainMenuItemTitle}>Disable dapplets on this page</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Power />
                    </span>
                  </li> */}
                  <li
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      p.onToggleClick()
                      p.navigate(`/system/dapplets`)

                      setMenuVisible(false)
                    }}
                    className={styles.mainMenuItem}
                  >
                    <span className={styles.mainMenuItemTitle}>Maximize extension</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Max />
                    </span>
                  </li>
                  {/* <li className={styles.mainMenuItem}>
                    <span className={styles.mainMenuItemTitle}>Edit lists</span>
                    <span className={styles.mainMenuItemIcon}>
                      <Edit />
                    </span>
                  </li> */}
                </ul>
              )}
          </ul>
        )
      }
    </div>
  )
}
