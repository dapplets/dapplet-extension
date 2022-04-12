import React, { useState, useRef, useEffect, useMemo } from 'react'
import styles from './components/Overlay/Overlay.module.scss'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { ContentItem } from './ContentItem'
import { DAPPLETS_STORE_URL } from '../../../common/constants'
import { OverlayManager } from './overlayManager'
import { OverlayToolbar } from './components/OverlayToolbar'
import cn from 'classnames'
import { ReactNode } from 'react'
import { Profile } from './components/Profile'
import { SquaredButton } from './components/SquaredButton'
import { Icon } from './components/Icon'
import { ReactComponent as StoreIcon } from './assets/svg/store.svg'
import { ReactComponent as SearchIcon } from './assets/svg/magnifying-glass.svg'
import { ReactComponent as EthereumIcon } from './assets/icons/ephir.svg'
import { ReactComponent as Home } from './assets/svg/home-toolbar.svg'
import { ReactComponent as Settings } from './assets/svg/setting-toolbar.svg'
import { ReactComponent as Notification } from './assets/svg/notification.svg'
import { ReactComponent as Airplay } from './assets/svg/airplay.svg'
import { IMenu } from './models/menu.model'

import '@fontsource/roboto'
import '@fontsource/montserrat'
import { Dapplets } from './pages/Dapplets'
import { Notifications } from './pages/Notifications'
import { SettingsOverlay } from './pages/Settings'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
TimeAgo.addLocale(en)

export type TSelectedSettings =
  | 'Dapplets'
  | 'Notifications'
  | 'Settings'
  | 'Developer'
// | 'Notifications'

const MENU: IMenu[] = [
  { _id: '0', icon: Home, title: 'Dapplets' },
  { _id: '1', icon: Notification, title: 'Notifications' },
  { _id: '2', icon: Settings, title: 'Settings' },
  { _id: '3', icon: Airplay, title: 'Developer' },
  // { _id: '4', icon: Notification, title: 'Notifications' },
]

interface P {
  onToggle: () => void
  overlayManager: OverlayManager
}

interface S {
  isLoadingMap: { [overlayId: string]: boolean }
  isDevMode: boolean
  selectedMenu: TSelectedSettings | null
  isSystemDapplets: boolean
}

export interface OverlayProps {
  children?: ReactNode
  baseNameSelectedSetting?: TSelectedSettings
}

export class App extends React.Component<P, S> {
  state: S = {
    isLoadingMap: Object.fromEntries(
      this.getOverlays().map((x) => [x.id, true])
    ),
    isDevMode: false,
    selectedMenu: 'Dapplets',

    isSystemDapplets: true,
  }

  async componentDidMount() {
    const { getDevMode } = await initBGFunctions(browser)
    const isDevMode = await getDevMode()

    this.setState({ isDevMode })
  }

  closeClickHandler = (overlayId: string) => {
    const overlay = this.getOverlays().find((x) => x.id === overlayId)
    overlay.close()
  }

  tabClickHandler = (overlayId: string) => {
    if (overlayId === 'system') return this.systemOverlays()

    const overlay = this.getOverlays().find((x) => x.id === overlayId)
    if (!overlay) return

    this.props.overlayManager.activate(overlay)
    this.setState({ selectedMenu: null, isSystemDapplets: false })
  }

  loadHandler = (overlayId: string) => {
    const { isLoadingMap } = this.state
    isLoadingMap[overlayId] = false
    this.setState({ isLoadingMap })
  }

  storeButtonClickHandler = () => {
    window.open(DAPPLETS_STORE_URL, '_blank')
  }

  getOverlays() {
    return this.props.overlayManager.getOverlays()
  }

  createTab = (overlayName: string) => {
    return this.props.overlayManager.openPopup(overlayName)
  }

  onSelectedMenu = (name: string) => {
    if (name === 'Dapplets') return this.systemOverlays()
    if (name !== 'Dapplets') this.setState({ isSystemDapplets: false })

    this.setState({ selectedMenu: name as TSelectedSettings })

    const overlays = this.getOverlays()
    const overlay = overlays.find((item) => item.title === name)

    if (!overlay) return this.createTab(name.toLowerCase())
    return this.props.overlayManager.activate(overlay)
  }

  getTabs = () =>
    this.getOverlays().filter((x) =>
      x.uri.includes('/popup.html#/dapplets')
        ? x
        : !x.uri.includes('/popup.html#')
    )

  systemOverlays = () => {
    this.setState({
      isSystemDapplets: true,
      selectedMenu: 'Dapplets',
    })
  }

  noSystemOverlay = () => {
    this.setState({
      isSystemDapplets: false,
    })
  }

  render() {
    const p = this.props
    const s = this.state
    const overlays = this.getOverlays().filter((x) => !x.parent)
    const activeOverlayId = p.overlayManager.activeOverlay?.id
    const activeOverlay = p.overlayManager.activeOverlay
    // TODO: naming wallets is the notification
    const isNotification = s.selectedMenu === 'Notifications'
    const isSettings = s.selectedMenu === 'Settings'

    return (
      <>
        <div className={cn(styles.overlay)}>
          <div className={styles.wrapper}>
            <OverlayToolbar
              tabs={overlays}
              isSystemDapplets={s.isSystemDapplets}
              menu={MENU}
              className={styles.toolbar}
              nameSelectedMenu={s.selectedMenu}
              idActiveTab={activeOverlayId}
              onOverlayTab={this.noSystemOverlay}
              activeOverlay={activeOverlay}
              isDevMode={s.isDevMode}
              onSelectedMenu={this.onSelectedMenu}
              onSelectedTab={this.tabClickHandler}
              onRemoveTab={this.closeClickHandler}
              toggle={this.props.onToggle}
            />

            <div className={styles.inner}>
              <header className={styles.header}>
                <div className={styles.left}>
                  <Profile
                    avatar="https://gafki.ru/wp-content/uploads/2019/11/kartinka-1.-aljaskinskij-malamut.jpg"
                    hash="0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa"
                  />
                  <div className={styles.balance}>
                    <Icon icon={EthereumIcon} size="big" />
                    <p className={styles.amount}>25.1054</p>
                  </div>
                </div>
                <div className={styles.right}>
                  <SquaredButton
                    appearance="big"
                    icon={StoreIcon}
                    onClick={this.storeButtonClickHandler}
                  />
                  <SquaredButton appearance="big" icon={SearchIcon} />
                </div>
              </header>

              <div
                className={cn(
                  styles.children,
                  'dapplets-overlay-nav-content-list'
                )}
              >
                {s.isSystemDapplets && <Dapplets />}

                {isNotification && <Notifications />}

                {isSettings && (
                  <div className={styles.settingsBlock}>
                    <SettingsOverlay />
                  </div>
                )}

                {overlays.map((x) => (
                  <div
                    key={x.id}
                    className={cn(styles.noSystemDapplets, {
                      // positionAbsolute hidden other content
                      [styles.hideContent]: s.isSystemDapplets,
                      // [styles.hideContent]: s.isSystemDapplets,

                      [styles.overlayActive]:
                        !s.isSystemDapplets && x.id === activeOverlayId,
                    })}
                  >
                    {/* <ContentItem
                      overlay={x}
                      isActive={x.id === activeOverlayId}
                      overlayManager={p.overlayManager}
                    /> */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}
