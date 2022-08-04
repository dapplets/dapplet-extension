import cn from 'classnames'
import React, { ReactElement, useRef, useState } from 'react'
import { ReactComponent as Coolicon } from '../../assets/svg/coolicon.svg'
import { ToolbarTab, ToolbarTabMenu } from '../../types'
import { OverlayTab } from '../OverlayTab'
import { ModalTabs } from './ModalTabs'
import styles from './OverlayToolbar.module.scss'

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
        <div style={{ background: '#f5f5f5', borderRadius: '10px 0 0 10px' }}>
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
        </div>

        <div className={cn(styles.tabs, {})}>
          <div className={styles.TabList}>
            {p.tabs.length > 0 &&
              p.tabs.map((tab) => (
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
              ))}
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
