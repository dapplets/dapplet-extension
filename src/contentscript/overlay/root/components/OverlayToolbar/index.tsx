import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../common/global-event-bus'
import {
  Notification as Notify,
  NotificationStatus,
  NotificationType,
} from '../../../../../common/models/notification'
import { ReactComponent as Show } from '../../assets/icons/iconsWidgetButton/show.svg'
import { ReactComponent as Notification } from '../../assets/icons/notificationIcons/bell.svg'
import { ReactComponent as NotificationWithCircle } from '../../assets/icons/notificationIcons/bellWithNotification.svg'
import {
  ReactComponent as Account,
  ReactComponent as DappletsLogo,
} from '../../assets/newIcon/mustache.svg'
import { useModal } from '../../contexts/ModalContext'
import { DappletAction, useDappletActions } from '../../hooks/useDappletActions'
import { useToggle } from '../../hooks/useToggle'
import { ToolbarTab, ToolbarTabMenu } from '../../types'
import { WidgetButton } from '../../widgets/button'
import { LabelButton } from '../../widgets/label'
import AlertConfirmPopup from '../AlertConfirmPopup'
import { OverlayTab } from '../OverlayTab'
import { NotificationOverlay } from './Notification'
import styles from './OverlayToolbar.module.scss'

const SYSTEM_TAB: ToolbarTab = {
  id: 'system',
  pinned: true,
  title: 'Dapplets',
  icon: DappletsLogo,
  menus: [
    {
      id: 'dapplets',
      icon: Account,
      title: 'Dapplets',
    },
    {
      id: 'notifications',
      icon: Notification,
      title: 'Notifications',
    },
  ],
}

// TODO: change element hiding from Margin to transform
export interface OverlayToolbarProps {
  tabs: ToolbarTab[]
  className: string
  activeTabId: string
  activeTabMenuId: string

  onTabClick: (tab: ToolbarTab) => void
  onCloseClick: (tab: ToolbarTab) => void
  onMenuClick: (tab: ToolbarTab, menu: ToolbarTabMenu) => void
  onToggleClick: () => void
  setOpenWallet: any
  isOpenWallet: boolean
  navigate?: any
  pathname?: string
  modules?: any
  overlays?: any
  widgets?: any
  connectedDescriptors?: any
  selectedWallet?: any
  isOverlayCollapsed: boolean
}

export const OverlayToolbar = (p: OverlayToolbarProps): ReactElement => {
  const { dappletActions, pinDappletAction, unpinDappletAction } = useDappletActions()
  const nodeOverlayToolbar = useRef<HTMLInputElement>()
  // const [isNodeOverlayToolbar, setNodeOverlayToolbar] = useState(false)
  const noSystemTabs = p.tabs.filter((f) => f.title !== 'Dapplets')
  const [isShowTabs, onShowTabs] = useToggle(true)
  // const [isClick, onClick] = useToggle(false)
  // const [widgets, setwidgets] = useState(widgets)
  const [isVisibleAnimation, setVisibleAnimation] = useState(false)
  const [iconAnimateWidget, setIconAnimateWidget] = useState('')
  const [isPinnedAnimateWidget, setPinnedAnimateWidget] = useState(false)
  const [isPinnedNotification, setPinnedNotification] = useState(false)
  const [event, setEvent] = useState<Notify[]>([])
  const [payload, setPayload] = useState(null)
  const btnRef = useRef<HTMLDivElement>()
  // const notificationRef = useRef<HTMLDivElement>()
  const [newNotifications, setNewNotifications] = useState([])

  const handleUpdateNotifications = async () => {
    const notifications = await getNotifications()
    setEvent(
      notifications && notifications.filter((x) => x.status === NotificationStatus.Highlighted)
    )
  }

  useEffect(() => {
    const updatePinnedNotifications = async (payload: any = null) => {
      const notifications = await getNotifications()
      if (payload) {
        setPinnedNotification(true)
        // ToDo: need to unsubscribe
        setTimeout(() => setPinnedNotification(false), 2000)
      }
      setPayload(payload)

      return setEvent(notifications)
    }

    const handleShowNotification = (message) => {
      if (!message || !message.type) return

      if (message.type === 'SHOW_NOTIFICATION') {
        return updatePinnedNotifications(message.payload)
      }
    }

    updatePinnedNotifications()

    EventBus.on('notifications_updated', handleUpdateNotifications)
    browser.runtime.onMessage.addListener(handleShowNotification)

    return () => {
      EventBus.off('notifications_updated', handleUpdateNotifications)
      browser.runtime.onMessage.removeListener(handleShowNotification)
    }
  }, [])

  useEffect(() => {
    if (!payload) return

    setNewNotifications([...newNotifications, payload])
  }, [payload])

  const { modals } = useModal()

  const onRemoveNotifications = (payload) => {
    setNewNotifications(newNotifications.filter((x) => x.id !== payload.id))
  }
  const getWigetsConstructor = (actions: DappletAction[], isMenu?: boolean) => {
    return actions.map((action, i) => {
      const newWidgetButton = action.action ? (
        <WidgetButton
          isMenu={isMenu ? isMenu : false}
          key={i}
          onClick={(e) => {
            !isMenu && e.preventDefault()
            !isMenu && e.stopPropagation()
            action.action()
          }}
          hidden={action.hidden ?? false}
          disabled={action.disabled ? action.disabled : false}
          icon={action.icon ? action.icon : null}
          title={action.title}
          pinned={action.pinned}
          onPinned={() => {
            action.pinned = !action.pinned
            setVisibleAnimation(true)

            setIconAnimateWidget(action.icon ? action.icon : null)
            setPinnedAnimateWidget(action.pinned)
            setTimeout(() => {
              setVisibleAnimation(false)
            }, 1100)

            if (action.pinned) {
              pinDappletAction(action.moduleName, action.pinnedID)
            } else {
              unpinDappletAction(action.moduleName, action.pinnedID)
            }
          }}
        />
      ) : (
        <LabelButton
          hidden={action.hidden ? action.hidden : false}
          icon={action.icon ? action.icon : null}
          key={i}
          title={action.title}
        />
      )
      return newWidgetButton
    })
  }

  const getNewButtonTab = (parametersFilter: string) => {
    const clone = Object.assign({}, SYSTEM_TAB)
    const newSystemTab = [clone]
    const newSet = newSystemTab.map((tab) => {
      const NewTabs = tab
      const filterNotifications = NewTabs.menus.filter((f) => f.title === parametersFilter)
      const newTab = NewTabs
      newTab.menus = filterNotifications
      const activeTabId = p.pathname.split('/')[1]
      const activeTabMenuId = p.pathname.split('/')[2]
      return (
        <div key={NewTabs.id}>
          <OverlayTab
            {...newTab}
            isOverlayCollapsed={p.isOverlayCollapsed}
            isToolbar={true}
            isActiveTab={activeTabId === NewTabs.id}
            activeTabMenuId={activeTabMenuId}
            classNameTab={styles.tabConnectedWrapper}
            onCloseClick={() => p.onCloseClick(NewTabs)}
            overlays={p.overlays}
            navigate={p.navigate}
            pathname={p.pathname}
            onToggleClick={p.onToggleClick}
            selectedWallet={p.selectedWallet}
            connectedDescriptors={p.connectedDescriptors}
            setOpenWallet={p.setOpenWallet}
            onMenuClick={(menu) => {
              if (p.isOverlayCollapsed) {
                p.onMenuClick(NewTabs, menu)

                p.onToggleClick()
              } else if (!p.isOverlayCollapsed) {
                if (p.pathname === '/system/connectedAccounts') {
                  p.onToggleClick()
                } else {
                  p.onMenuClick(NewTabs, menu)
                }
              }
            }}
            onTabClick={() => {
              p.onTabClick(NewTabs)
            }}
          />
        </div>
      )
    })
    return newSet
  }

  const getAnimateButtonWidget = (icon: string) => {
    return (
      <span
        ref={btnRef}
        className={cn(styles.widgetButtonAnimate, {
          [styles.widgetButtonAnimatePinned]: isPinnedAnimateWidget,
        })}
      >
        {icon && icon.length > 0 ? (
          <img data-visible className={cn(styles.widgetButtonImgAnimate)} src={icon} />
        ) : null}
      </span>
    )
  }

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getNotifications } = backgroundFunctions

    const notifications: Notify[] = await getNotifications(NotificationType.Application)

    return notifications
  }

  const handleOpenOverlayNotification = (id) => {
    if (p.isOverlayCollapsed) {
      p.navigate('/system/notifications', { state: { targetID: id, isLaterRead: true } })
      p.onToggleClick()
    } else {
      p.navigate('/system/notifications', { state: { targetID: id, isLaterRead: true } })
    }
  }

  return (
    <div
      ref={nodeOverlayToolbar}
      className={cn(
        styles.overlayToolbar,
        // {
        //   [styles.mobileToolbar]: isNodeOverlayToolbar,
        // },
        p.className
      )}
    >
      <div className={styles.inner}>
        <div className={cn(styles.tabs, {})}>
          <div
            onClick={() => {
              p.isOpenWallet && p.setOpenWallet()
            }}
            className={cn(styles.TabList, { [styles.isOpenWallet]: p.isOpenWallet })}
          >
            {getNewButtonTab('Dapplets')}

            <span
              data-testid="notification-button"
              className={cn(styles.notificationCounter)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (p.isOverlayCollapsed) {
                  p.navigate('/system/notifications')
                  p.onToggleClick()
                } else {
                  p.navigate('/system/notifications')
                }
              }}
            >
              {event &&
              event.filter((x) => x.status === NotificationStatus.Highlighted).length > 0 ? (
                <span className={styles.counter} data-testid="notification-counter">
                  +{event.filter((x) => x.status === NotificationStatus.Highlighted).length}
                </span>
              ) : null}
              {event &&
              event.filter((x) => x.status === NotificationStatus.Highlighted).length > 0 ? (
                <NotificationWithCircle />
              ) : (
                <Notification />
              )}
              <span
                className={cn({
                  [styles.notificationCounterAnimate]: isPinnedNotification,
                })}
              ></span>
            </span>
            <div className={styles.notificationsWrapper}>
              {!!newNotifications.length &&
                newNotifications.map((payload) => (
                  <NotificationOverlay
                    key={payload.id}
                    payload={payload}
                    onRemove={onRemoveNotifications}
                    handleOpenOverlayNotification={handleOpenOverlayNotification}
                  />
                ))}
              {!!modals.length &&
                modals.map((alertOrConfirm) => (
                  <AlertConfirmPopup key={alertOrConfirm.id} payload={alertOrConfirm} />
                ))}
            </div>

            {isVisibleAnimation && getAnimateButtonWidget(iconAnimateWidget)}

            {/* Pinned Dapplet Actions */}
            {!isShowTabs && p.isOverlayCollapsed ? getWigetsConstructor(dappletActions) : null}

            {p.modules?.filter((x) => x.isActive).length !== 0 && (
              <>
                <div
                  data-testid={isShowTabs ? 'toolbar-show' : 'toolbar-hide'}
                  className={cn(styles.toggleTabs, {
                    [styles.hideTabs]: !isShowTabs,
                  })}
                >
                  {noSystemTabs.length > 0 &&
                    noSystemTabs.map((tab) => {
                      const menuWidgets = dappletActions.filter((x) => x.moduleName === tab.id)

                      const hasActionHandler = (): boolean => {
                        const moduleData = p.modules?.find((x) => x.name === tab.id)
                        return moduleData?.isActionHandler
                      }

                      return (
                        <OverlayTab
                          isOverlayCollapsed={p.isOverlayCollapsed}
                          setOpenWallet={p.setOpenWallet}
                          isOpenWallet={p.isOpenWallet}
                          key={tab.id}
                          {...tab}
                          isActiveTab={p.activeTabId === tab.id}
                          activeTabMenuId={p.activeTabMenuId}
                          onCloseClick={() => p.onCloseClick(tab)}
                          onMenuClick={(menu) => p.onMenuClick(tab, menu)}
                          onTabClick={() => p.onTabClick(tab)}
                          hasActionHandler={hasActionHandler()}
                          pathname={p.pathname}
                          navigate={p.navigate}
                          overlays={p.overlays}
                          onToggleClick={p.onToggleClick}
                          getWigetsConstructor={getWigetsConstructor}
                          menuWidgets={menuWidgets}
                          mainMenuNavigation={p.onMenuClick}
                        />
                      )
                    })}
                </div>
                <div
                  className={cn({
                    [styles.divHidden]:
                      p.modules &&
                      p.modules.length &&
                      p.modules.filter((x) => x.isActive).length === 0,
                  })}
                >
                  {noSystemTabs.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onShowTabs()
                      }}
                      data-testid="show-tabs-button"
                      className={cn(styles.miniButton, {
                        [styles.hideTabsBtn]: isShowTabs,
                      })}
                    >
                      <Show />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
