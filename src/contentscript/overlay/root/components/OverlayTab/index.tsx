import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import makeBlockie from 'ethereum-blockies-base64'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import { DAPPLETS_STORE_URL } from '../../../../../common/constants'
import * as EventBus from '../../../../../common/global-event-bus'
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../../../../../common/models/notification'
import { ReactComponent as Store } from '../../assets/icons/iconsWidgetButton/store.svg'
import { ReactComponent as Event } from '../../assets/newIcon/notification.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/newHome.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/newSettings.svg'
import { StorageRefImage } from '../../components/StorageRefImage'
import { ModuleIcon } from '../ModuleIcon'
import { SquaredButton } from '../SquaredButton'
import styles from './styles/OverlayTab.module.scss'
import { OverlayTabProps } from './types'

export const OverlayTab = (p: OverlayTabProps): ReactElement => {
  const visibleMenus = p.menus.filter((x) => x.hidden !== true)
  const nodeVisibleMenu = useRef<HTMLDivElement>()
  const [menuVisible, setMenuVisible] = useState(false)
  const [event, setEvent] = useState<Notification[]>([])

  useEffect(() => {
    !p.isOverlayCollapsed && setMenuVisible(false)
  }, [menuVisible, p])

  useEffect(() => {
    const handleUpdateNotifications = async () => {
      const notifications = await getNotifications()
      setEvent(
        notifications && notifications.filter((x) => x.status === NotificationStatus.Highlighted)
      )
    }

    handleUpdateNotifications()

    const handleShowNotification = (message) => {
      if (!message || !message.type) return

      if (message.type === 'SHOW_NOTIFICATION') {
        return handleUpdateNotifications()
      }
    }

    EventBus.on('notifications_updated', handleUpdateNotifications)
    browser.runtime.onMessage.addListener(handleShowNotification)

    return () => {
      EventBus.off('notifications_updated', handleUpdateNotifications)
      browser.runtime.onMessage.removeListener(handleShowNotification)
    }
  }, [p])

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
    const isOverlayActive = !!p.overlays && p.overlays.find((x) => x.source === f)
    if (p.hasActionHandler) {
      if ((p.pathname.includes('system') && p.overlays.lenght === 0) || !isOverlayActive) {
        try {
          const { openDappletAction, getCurrentTab } = await initBGFunctions(browser)
          const tab = await getCurrentTab()
          if (!tab) return
          await openDappletAction(f, tab.id)
          if (p.isOverlayCollapsed) {
            p.onToggleClick()
          }
        } catch (err) {
          console.error(err)
        }
      } else {
        p.overlays.filter((x) => x.source === f).map((x) => p.navigate!(`/${f}/${x.id}`))
        if (p.isOverlayCollapsed) {
          p.onToggleClick()
        }
      }
    } else {
      p.onTabClick()
      if (p.isOverlayCollapsed) {
        p.onToggleClick()
      }
    }
  }

  const onOpenStore = async (f: string) => {
    const url = `${DAPPLETS_STORE_URL}/#searchQuery=${f}`
    window.open(url, '_blank')
  }

  const getNotifications = async () => {
    const { getNotifications } = await initBGFunctions(browser)
    const notifications = await getNotifications(NotificationType.Application)
    return notifications
  }

  return (
    <>
      <div
        data-testid={!p.pinned ? 'tab-not-pinned' : 'tab-pinned'}
        tabIndex={0}
        onBlur={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (p.isOverlayCollapsed) {
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

          if (p.isOverlayCollapsed) {
            setMenuVisible(!menuVisible)
          } else {
            onOpenDappletAction(p.id) && setMenuVisible(false)
          }
        }}
        className={cn(styles.tab, p.classNameTab, {
          [styles.tabNotActive]: !p.isActiveTab,
          // [styles.menuWidgets]: !p.pinned && menuVisible
          // [styles.isOpenWallet]: p.isOpenWallet,
        })}
      >
        {!p.pinned &&
        menuVisible &&
        // p.menuWidgets.length &&
        p.isOverlayCollapsed ? (
          <div ref={nodeVisibleMenu} className={styles.menuWidgets}>
            {p.getWigetsConstructor(p.menuWidgets, true)}
            <div
              className={cn(styles.delimeterMenuWidgets, {
                [styles.invisibleDelimeter]: !p.menuWidgets.length,
              })}
            ></div>
            <div className={styles.blockStandartFunction}>
              <SquaredButton
                className={styles.squaredButtonMenuWidget}
                data-visible
                appearance={'big'}
                icon={HomeIcon}
                disabled={!p.hasActionHandler}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuVisible(!menuVisible)
                  onOpenDappletAction(p.id)
                }}
              />
              <SquaredButton
                className={styles.squaredButtonMenuWidget}
                data-visible
                appearance={'big'}
                icon={SettingsIcon}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuVisible(!menuVisible)
                  p.navigate(`/${p.id}/settings`)
                  p.onToggleClick()
                }}
              />
              <SquaredButton
                className={styles.squaredButtonMenuWidget}
                data-visible
                appearance={'big'}
                icon={Store}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenStore(p.id)
                }}
              />
            </div>
          </div>
        ) : null}
        <div className={styles.top}>
          {p.icon && typeof p.icon === 'function' ? null : p.icon &&
            typeof p.icon === 'object' &&
            'moduleName' in p.icon ? (
            <ModuleIcon
              className={cn(
                styles.image,
                {
                  [styles.cursor]: !p.isActiveTab,
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
                  [styles.cursor]: !p.isActiveTab,
                },
                p.classNameIcon
              )}
              storageRef={p.icon as any}
            />
          )}
        </div>

        {p.pinned && visibleMenus.length > 0 && (
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

                    if (p.isOverlayCollapsed) {
                      // todo: uncomment when main menu will be works
                      // menu.id === 'dapplets' && setMenuVisible(!menuVisible)

                      if (p.pathname === '/system/dapplets') {
                        p.onToggleClick()
                      } else {
                        //todo: uncomment when main menu will be works
                        // p.navigate('/system/dapplets')
                        //todo: remove when main menu will be works

                        p.onToggleClick()
                      }

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
                        onOpenDappletAction(p.id)
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
                    menu.id === 'notifications' && event.length > 0 ? (
                      <Event data-testid="notification-page" />
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
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
