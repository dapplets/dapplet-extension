import cn from 'classnames'
import React, { ReactElement, useRef, useState } from 'react'
import {
  ReactComponent as Account,
  ReactComponent as DappletsLogo,
} from '../../assets/newIcon/mustache.svg'
import { ReactComponent as Coolicon } from '../../assets/newIcon/squares.svg'
import { ToolbarTab, ToolbarTabMenu } from '../../types'
import { OverlayTab } from '../OverlayTab'
import { ModalTabs } from './ModalTabs'
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
        getNode()
      }}
    >
      <Coolicon />
    </button>
  )
}

export const OverlayToolbar = (p: OverlayToolbarProps): ReactElement => {
  const nodeOverlayToolbar = useRef<HTMLInputElement>()
  const [isNodeOverlayToolbar, setNodeOverlayToolbar] = useState(false)
  const [isVisibleMobileTabs, setVisibleMobileTabs] = useState(false)
  const closeMobileModal = () => setVisibleMobileTabs(false)
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
  const noSystemTabs = p.tabs.filter((f) => f.title !== 'Dapplets')

  const getNewButtonTab = (parametersFilter: string) => {
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
        <OverlayTab
          key={NewTabs.id}
          {...newTab}
          isActive={activeTabId === NewTabs.id}
          activeTabMenuId={activeTabMenuId}
          classNameTab={styles.tabConnectedWrapper}
          onCloseClick={() => p.onCloseClick(NewTabs)}
          onMenuClick={(menu) => {
            if (
              p.pathname === '/system/connectedAccounts' &&
              !document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('CollapsedOverlayClass')
            ) {
              p.onToggleClick()
            } else if (
              document
                .querySelector('#dapplets-overlay-manager')
                .classList.contains('CollapsedOverlayClass')
            ) {
              p.onToggleClick()
            } else {
              p.onMenuClick(NewTabs, menu)
            }
          }}
          onTabClick={() => {
            p.onTabClick(NewTabs)
          }}
        />
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
            {noSystemTabs.length > 0 &&
              noSystemTabs.map((tab) => {
                return (
                  <OverlayTab
                    setOpenWallet={p.setOpenWallet}
                    isOpenWallet={p.isOpenWallet}
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
            <ToggleOverlay
              getNode={handleClickGetNodeOverlayToolbar}
              onClick={() => {
                if (p.pathname === '/system/dapplets') {
                  p.setOpenWallet()
                  p.onToggleClick()
                } else {
                  if (
                    document
                      .querySelector('#dapplets-overlay-manager')
                      .classList.contains('CollapsedOverlayClass')
                  ) {
                    p.onToggleClick()
                  } else {
                    p.navigate('/system/dapplets')
                    p.onToggleClick()
                  }
                }
              }}
              className={cn(styles.toggleOverlay, {
                [styles.isOpenWallet]: p.isOpenWallet,
              })}
            />
            <div>
              <button className={cn(styles.miniButton)}></button>
            </div>
          </div>
        </div>
        <div className={cn(styles.tabsMobile, {})}>
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
        </div>
      </div>
    </div>
  )
}
