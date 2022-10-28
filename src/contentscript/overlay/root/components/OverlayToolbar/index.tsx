import cn from 'classnames'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import {
  ReactComponent as Account,
  ReactComponent as DappletsLogo,
} from '../../assets/newIcon/mustache.svg'
import { ReactComponent as Coolicon } from '../../assets/newIcon/squares.svg'
import { useToggle } from '../../hooks/useToggle'
import { ToolbarTab, ToolbarTabMenu } from '../../types'
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
}

type TToggleOverlay = {
  onClick: () => void
  className?: string
  getNode?: () => void
}

const ToggleOverlay = ({ onClick, className, getNode }: TToggleOverlay): ReactElement => {
  return (
    <button
      className={cn(styles.toggleOverlay, className)}
      onClick={() => {
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
  // if(document
  //   .querySelector('#dapplets-overlay-manager')
  //   .classList.contains('dapplets-overlay-hidden')){
  //     p.navigate!('/system/dapplets')
  //   }
  useEffect(() => {
    // if (!p.module) return
  }, [
    // // document,
    // p.pathname,
    // p.tabs,
    // noSystemTabs,
    // isShowTabs,
    p.module,
    // p.activeTabMenuId
    // // nodeOverlayToolbar,
  ])
  // useEffect(() => {}, [document, p.pathname])
  const handleClickGetNodeOverlayToolbar = () => {
    if (nodeOverlayToolbar && nodeOverlayToolbar.current) {
      nodeOverlayToolbar.current.value = ''

      const element = nodeOverlayToolbar.current.getBoundingClientRect()

      const x = element.x

      if (x > 10 && x < 100) {
        setNodeOverlayToolbar(true)
      } else {
        setNodeOverlayToolbar(false)
      }
    }
  }

  const getNewButtonTab = (parametersFilter: string) => {
    // if(document
    //   .querySelector('#dapplets-overlay-manager')
    //   .classList.contains('dapplets-overlay-hidden')){
    //     p.navigate!('/system/dapplets')
    //   }
    // if (!p.module) return
    let clone = Object.assign({}, SYSTEM_TAB)
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
          {!p.module ? (
            <div className={styles.loaderAccount}></div>
          ) : (
            <OverlayTab
              {...newTab}
              isActive={activeTabId === NewTabs.id}
              activeTabMenuId={activeTabMenuId}
              classNameTab={styles.tabConnectedWrapper}
              onCloseClick={() => p.onCloseClick(NewTabs)}
              overlays={p.overlays}
              modules={p.module}
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
          )}
        </div>
      )
    })
    return newSet
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
        {/* <div style={{ background: '#f5f5f5', borderRadius: '10px 0 0 10px' }}>
          <ToggleOverlay
            getNode={handleClickGetNodeOverlayToolbar}
            onClick={() => {
              p.setOpenWallet()
              p.onToggleClick()
            }}
            className={cn(styles.toggleOverlay, {
              [styles.isOpenWallet]: p.isOpenWallet,
            })}
          />
        </div> */}

        <div className={cn(styles.tabs, {})}>
          <div className={styles.TabList}>
            {getNewButtonTab('Connected Accounts')}
            <div
              className={cn(styles.toggleTabs, {
                [styles.hideTabs]: !isShowTabs,
              })}
            >
              {noSystemTabs.length > 0 &&
                noSystemTabs.map((tab) => {
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
                  [styles.isOpenWallet]: p.isOpenWallet,
                  // [styles.isOpenDappletPage]:  !document
                  // .querySelector('#dapplets-overlay-manager')
                  // .classList.contains('CollapsedOverlayClass')
                })}
              />
            </div>
            <div>
              <button
                onClick={() => onShowTabs()}
                className={cn(styles.miniButton, {
                  [styles.hideTabsBtn]: isShowTabs,
                })}
              ></button>
            </div>
          </div>
        </div>
        {/* <div className={cn(styles.tabsMobile, {})}>
          <span className={styles.noSystemTabLabel} onClick={() => setVisibleMobileTabs(true)} />
          <ModalTabs
            visible={isVisibleMobileTabs}
            content={
              <div className={styles.TabListMobile}>
                {p.tabs.length > 0 &&
                  p.tabs.map((tab) => {
                    // if (tab.id === 'system') return

                    return (
                      <OverlayTab
                        // setOpenWallet={p.setOpenWallet}
                        // isOpenWallet={p.isOpenWallet}
                        key={tab.id}
                        {...tab}
                        isActive={p.activeTabId === tab.id}
                        activeTabMenuId={p.activeTabMenuId}
                        onCloseClick={() => p.onCloseClick(tab)}
                        onMenuClick={(menu) => p.onMenuClick(tab, menu)}
                        onTabClick={() => p.onTabClick(tab)}
                      />
                    )
                  })}
              </div>
            }
            onClose={() => closeMobileModal()}
            classNameCLose={styles.noSystemTabLabel}
          />
        </div> */}
      </div>
    </div>
  )
}
