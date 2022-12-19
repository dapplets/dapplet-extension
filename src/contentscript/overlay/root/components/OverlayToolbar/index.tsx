import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { widgets } from '../../../../modules/adapter-overlay/src'
import {
  ReactComponent as Account,
  ReactComponent as DappletsLogo,
} from '../../assets/newIcon/mustache.svg'
import { ReactComponent as Coolicon } from '../../assets/newIcon/squares.svg'
import { useToggle } from '../../hooks/useToggle'
import { ToolbarTab, ToolbarTabMenu } from '../../types'
import { WidgetButton } from '../../widgets/button'
import { LabelButton } from '../../widgets/label'
import { OverlayTab } from '../OverlayTab'
import styles from './OverlayToolbar.module.scss'

const SYSTEM_TAB: ToolbarTab = {
  id: 'system',
  pinned: true,
  title: 'Dapplets',
  icon: DappletsLogo,
  menus: [
    {
      id: 'connectedAccounts',
      icon: Account,
      title: 'Connected Accounts',
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
  module?: any
  overlays?: any
  widgets?: any
  connectedDescriptors?: any
  selectedWallet?: any
}

type TToggleOverlay = {
  onClick: () => void
  className?: string
  getNode?: () => void
}

const ToggleOverlay = ({ onClick, className, getNode }: TToggleOverlay): ReactElement => {
  return (
    <button
      data-testid="toggle-overlay-button"
      className={cn(styles.toggleOverlay, className)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
        // getNode()
      }}
    >
      <Coolicon />
    </button>
  )
}

export const OverlayToolbar = (p: OverlayToolbarProps): ReactElement => {
  const nodeOverlayToolbar = useRef<HTMLInputElement>()
  const [isNodeOverlayToolbar, setNodeOverlayToolbar] = useState(false)
  const noSystemTabs = p.tabs.filter((f) => f.title !== 'Dapplets')
  const [isShowTabs, onShowTabs] = useToggle(false)
  const [isClick, onClick] = useToggle(false)

  const [newWidgets, setNewWidgets] = useState(widgets)
  const [pinnedActionButton, setPinnedActionButton] = useState(null)
  const [isVisibleAnimation, setVisibleAnimation] = useState(false)
  const [iconAnimateWidget, setIconAnimateWidget] = useState('')
  const [isPinnedAnimateWidget, setPinnedAnimateWidget] = useState(false)
  const btnRef = useRef<HTMLDivElement>()
  useEffect(() => {
    const init = async () => {
      await _refreshData()
    }

    init()
    return () => {}
  }, [newWidgets, widgets, nodeOverlayToolbar, isClick])
  const _refreshData = async () => {
    try {
      const { getPinnedActions } = await initBGFunctions(browser)

      const pinnedAction = await getPinnedActions()
      setPinnedActionButton(pinnedAction)
    } catch (err) {
      console.error(err)
    }
  }
  const addPinnedButton = async (name, pinId) => {
    try {
      const { addPinnedActions } = await initBGFunctions(browser)

      await addPinnedActions(name, pinId)
      await _refreshData()
    } catch (err) {
      console.error(err)
    }
  }
  const removePinnedButton = async (name, pinId) => {
    try {
      const { removePinnedActions } = await initBGFunctions(browser)

      await removePinnedActions(name, pinId)
      await _refreshData()
    } catch (err) {
      console.error(err)
    }
  }

  const getWigetsConstructor = (widgets, isMenu?: boolean) => {
    if (widgets && widgets.length > 0) {
      const widgetsInConstructor = widgets
      const widgetsParse = [widgetsInConstructor].map((widgetsItems, i) => {
        const widgetsObject = widgetsItems.map((item, i) => {
          const newKey = item.orderIndex
          const widgetsObjectActivate = item.MENU_ACTION().map((widgetItem, i) => {
            const isPinned = pinnedActionButton
              ? pinnedActionButton.filter((x, i) => {
                  const pinnedBoolean =
                    x.dappletName === item.moduleName &&
                    x.widgetPinId === widgetItem().state.pinnedID
                      ? true
                      : false
                  return pinnedBoolean
                })
              : false

            const newWidgetButton = widgetItem().state.action ? (
              <WidgetButton
                isMenu={isMenu ? isMenu : false}
                key={`${newKey}` + i}
                onClick={(e) => {
                  !isMenu && e.preventDefault()
                  !isMenu && e.stopPropagation()
                  widgetItem().state.action(widgetItem().state.ctx, widgetItem().state)
                  onClick()
                }}
                hidden={widgetItem().state.hidden ? widgetItem().state.hidden : false}
                disabled={widgetItem().state.disabled ? widgetItem().state.disabled : false}
                icon={widgetItem().state.icon ? widgetItem().state.icon : null}
                title={widgetItem().state.title}
                pinned={isPinned.length > 0 ? true : false}
                onPinned={() => {
                  widgetItem().state.pinned = !widgetItem().state.pinned
                  setVisibleAnimation(true)

                  setIconAnimateWidget(widgetItem().state.icon ? widgetItem().state.icon : null)
                  setPinnedAnimateWidget(isPinned.length > 0 ? true : false)
                  setTimeout(() => {
                    setVisibleAnimation(false)
                  }, 1100)
                  if (pinnedActionButton) {
                    pinnedActionButton.map((x, i) => {
                      if (
                        x.dappletName === item.moduleName &&
                        x.widgetPinId === widgetItem().state.pinnedID
                      ) {
                        removePinnedButton(item.moduleName, widgetItem().state.pinnedID)
                      } else {
                        addPinnedButton(item.moduleName, widgetItem().state.pinnedID)
                      }
                    })
                  } else {
                    addPinnedButton(item.moduleName, widgetItem().state.pinnedID)
                  }
                  onClick()
                }}
              />
            ) : (
              <LabelButton
                hidden={widgetItem().state.hidden ? widgetItem().state.hidden : false}
                icon={widgetItem().state.icon ? widgetItem().state.icon : null}
                key={`${newKey}` + i}
                title={widgetItem().state.title}
              />
            )
            return newWidgetButton
          })

          return widgetsObjectActivate
        })
        return widgetsObject
      })
      return widgetsParse
    } else null
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
            isToolbar={true}
            isActive={activeTabId === NewTabs.id}
            activeTabMenuId={activeTabMenuId}
            classNameTab={styles.tabConnectedWrapper}
            onCloseClick={() => p.onCloseClick(NewTabs)}
            overlays={p.overlays}
            modules={p.module}
            navigate={p.navigate}
            pathname={p.pathname}
            onToggleClick={p.onToggleClick}
            selectedWallet={p.selectedWallet}
            connectedDescriptors={p.connectedDescriptors}
            setOpenWallet={p.setOpenWallet}
            onMenuClick={(menu) => {
              if (
                document
                  .querySelector('#dapplets-overlay-manager')
                  .classList.contains('dapplets-overlay-collapsed')
              ) {
                p.onMenuClick(NewTabs, menu)

                p.onToggleClick()
              } else if (
                !document
                  .querySelector('#dapplets-overlay-manager')
                  .classList.contains('dapplets-overlay-collapsed')
              ) {
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

  const getAnimateButtonWidget = (icon: string, isPinned: boolean) => {
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

  return (
    <div
      ref={nodeOverlayToolbar}
      className={cn(
        styles.overlayToolbar,
        {
          [styles.mobileToolbar]: isNodeOverlayToolbar,
        },
        p.className
      )}
    >
      <div className={styles.inner}>
        <div className={cn(styles.tabs, {})}>
          <div
            onClick={() => p.setOpenWallet()}
            className={cn(styles.TabList, { [styles.isOpenWallet]: p.isOpenWallet })}
          >
            {getNewButtonTab('Connected Accounts')}
            {isVisibleAnimation && getAnimateButtonWidget(iconAnimateWidget, isPinnedAnimateWidget)}
            {!isShowTabs &&
              document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('dapplets-overlay-collapsed') &&
              (newWidgets && newWidgets.length > 0
                ? getWigetsConstructor(newWidgets).map((x) => x)
                : null)}

            <div
              data-testid={isShowTabs ? 'toolbar-show' : 'toolbar-hide'}
              className={cn(styles.toggleTabs, {
                [styles.hideTabs]: !isShowTabs,
              })}
            >
              {noSystemTabs.length > 0 &&
                noSystemTabs.map((tab) => {
                  const menuWidgets =
                    newWidgets &&
                    newWidgets.length > 0 &&
                    newWidgets.filter((x) => x.moduleName === tab.id)

                  return (
                    <OverlayTab
                      setOpenWallet={p.setOpenWallet}
                      isOpenWallet={p.isOpenWallet}
                      key={tab.id}
                      tabId={tab.id}
                      {...tab}
                      isActive={p.activeTabId === tab.id}
                      activeTabMenuId={p.activeTabMenuId}
                      onCloseClick={() => p.onCloseClick(tab)}
                      onMenuClick={(menu) => p.onMenuClick(tab, menu)}
                      onTabClick={() => p.onTabClick(tab)}
                      modules={p.module}
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

              <ToggleOverlay
                // getNode={handleClickGetNodeOverlayToolbar}
                onClick={() => {
                  if (
                    document
                      .querySelector('#dapplets-overlay-manager')
                      .classList.contains('dapplets-overlay-collapsed')
                  ) {
                    p.navigate('/system/dapplets')

                    p.onToggleClick()
                  } else if (
                    !document
                      .querySelector('#dapplets-overlay-manager')
                      .classList.contains('dapplets-overlay-collapsed')
                  ) {
                    if (p.pathname === '/system/dapplets') {
                      p.onToggleClick()
                    } else {
                      p.navigate('/system/dapplets')
                    }
                  }
                }}
                className={cn(styles.toggleOverlay, {
                  // [styles.isOpenWallet]: p.isOpenWallet,
                })}
              />
            </div>
            <div>
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
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
