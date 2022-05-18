import React, { useState, useRef, useEffect, useMemo } from 'react'
import styles from './components/Overlay/Overlay.module.scss'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { ContentItem } from './ContentItem'
import { DAPPLETS_STORE_URL, ModuleTypes } from '../../../common/constants'
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
import { ReactComponent as Card } from './assets/svg/card.svg'
import { IMenu } from './models/menu.model'

import '@fontsource/roboto'
import '@fontsource/montserrat'
import { Dapplets } from './pages/Dapplets'
import { Notifications } from './pages/Notifications'
import { SettingsOverlay } from './pages/Settings'
import { UserSettings } from './pages/UserSettings'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Search } from './components/Search'
import { ManifestAndDetails } from '../../../popup/components/dapplet'
import ManifestDTO from '../../../background/dto/manifestDTO'

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  MemoryRouter,
  useNavigate,
} from 'react-router-dom'
import { Developer } from './pages/Settings/Developer'
TimeAgo.addLocale(en)

export type TSelectedSettings =
  | 'Dapplets'
  | 'Notifications'
  | 'Settings'
  | 'Developer'

const MENU: IMenu[] = [
  { _id: '0', icon: Home, title: 'Dapplets' },
  { _id: '1', icon: Notification, title: 'Notifications' },
  { _id: '2', icon: Settings, title: 'Settings' },
  // { _id: '3', icon: Airplay, title: 'Developer' },
  { _id: '4', icon: Card, title: 'Wallet' },
]
const MENUACTIVETABS: IMenu[] = [
  // { _id: '0', icon: Home, title: 'Dapplets' },
  // { _id: '1', icon: null, title: 'User Settings' },
]
export type TabsActiveSettings = 'User Settings'

interface P {
  onToggle: () => void
  overlayManager: OverlayManager
}

interface S {
  isLoadingMap: { [overlayId: string]: boolean }
  isDevMode: boolean
  selectedMenu: TSelectedSettings | null
  isSystemDapplets: boolean
  isOpenSearch: boolean
  search: string
  dappletUserSettings: ManifestAndDetails & {
    users: any[]
    website: string
    isFavourites: boolean
  }
  // tabsMenu: TabsActiveSettings | null
}

export interface OverlayProps {
  children?: ReactNode
  baseNameSelectedSetting?: TSelectedSettings
}

export class App extends React.Component<P, S> {
  private _isMounted: boolean = false
  state: S = {
    isLoadingMap: Object.fromEntries(
      this.getOverlays().map((x) => [x.id, true])
    ),
    isDevMode: false,
    selectedMenu: 'Dapplets',

    isSystemDapplets: true,
    isOpenSearch: false,
    search: '',
    dappletUserSettings: null,
    // tabsMenu: null,
    // features: [],
    // isNoContentScript: false,
    // contextIds: [],
  }

  async componentDidMount() {
    this._isMounted = true
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
    if (name === 'Dapplets') {
      this.systemOverlays()
      // navigate(`/`)
    }
    if (name !== 'Dapplets') {
      this.setState({ isSystemDapplets: false })
      // navigate(`/${name.toLowerCase()}`)
    }

    this.setState({ selectedMenu: name as TSelectedSettings })

    const overlays = this.getOverlays()
    const overlay = overlays.find((item) => item.title === name)

    if (!overlay) return this.createTab(name.toLowerCase())

    return this.props.overlayManager.activate(overlay)
  }
  onSelectedActiveMenu = (name: string) => {
    if (name === 'User Settings') return this.systemOverlays()
    if (name !== 'User Settings') this.setState({ isSystemDapplets: false })

    // this.setState({ tabsMenu: name as TabsActiveSettings })

    const overlays = this.getOverlays()
    const overlay = overlays.find((item) => item.title === name)

    if (!overlay) return this.createTab(name.toLowerCase())
    // console.log(name)

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

  onOpenSearch = () => {
    this.setState({
      isOpenSearch: true,
    })
  }
  onCloseSearch = () => {
    this.setState({
      isOpenSearch: false,
      search: '',
    })
  }

  _searchChangeHandler(value: string) {
    this.setState({ search: value })
  }
  _getNewUserSettings = async (
    value: ManifestAndDetails & {
      users: any[]
      website: string
      isFavourites: boolean
    }
  ) => {
    if (!value) return
    this.setState({ dappletUserSettings: value })
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
    // const isUserSettings = s.tabsMenu === 'User Settings'
    // const isUserSettings = MENUACTIVETABS.filter((x) => {
    //   return x.title === 'Settings'
    // })
    // console.log(isUserSettings)
    // console.log(s.dappletUserSettings)
    return (
      <MemoryRouter>
        <div className={cn(styles.overlay)}>
          <div className={styles.wrapper}>
            <OverlayToolbar
              tabs={overlays}
              isSystemDapplets={s.isSystemDapplets}
              menu={MENU}
              className={styles.toolbar}
              nameSelectedMenu={s.selectedMenu}
              // nameActiveTab={s.tabsMenu}
              idActiveTab={activeOverlayId}
              onOverlayTab={this.noSystemOverlay}
              activeOverlay={activeOverlay}
              isDevMode={s.isDevMode}
              onSelectedMenu={this.onSelectedMenu}
              // onSelectedActiveMenu={this.onSelectedActiveMenu}
              onSelectedTab={this.tabClickHandler}
              onRemoveTab={this.closeClickHandler}
              toggle={this.props.onToggle}
              // menuActiveTabs={MENUACTIVETABS}
            />

            <div className={styles.inner}>
              <header className={styles.header}>
                <div className={styles.left}>
                  <Profile
                    avatar="https://gafki.ru/wp-content/uploads/2019/11/kartinka-1.-aljaskinskij-malamut.jpg"
                    hash="0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa"
                  />
                </div>
                <div className={styles.right}>
                  <SquaredButton
                    appearance="big"
                    icon={StoreIcon}
                    onClick={this.storeButtonClickHandler}
                  />
                  {!s.isOpenSearch && !isNotification && !isSettings && (
                    <SquaredButton
                      onClick={this.onOpenSearch}
                      appearance="big"
                      icon={SearchIcon}
                    />
                  )}

                  {s.isOpenSearch && !isNotification && !isSettings && (
                    <div className={styles.searchBlock} tabIndex={1}>
                      <Search
                        value={s.search}
                        onChange={(e) =>
                          this._searchChangeHandler(e.target.value)
                        }
                        onClick={() => this._searchChangeHandler('')}
                        onClearValue={() => this._searchChangeHandler('')}
                        onCloseSearch={this.onCloseSearch}
                      />
                    </div>
                  )}
                </div>
              </header>

              <div
                className={cn(
                  styles.children,
                  'dapplets-overlay-nav-content-list'
                )}
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Dapplets
                        search={s.search}
                        userSettings={s.dappletUserSettings}
                        _getNewUserSettings={this._getNewUserSettings}
                      />
                    }
                  ></Route>
                  <Route
                    path="/notifications"
                    element={<Notifications />}
                  ></Route>
                  <Route path="/settings" element={<SettingsOverlay />}></Route>
                  <Route path="/card" element={<></>}></Route>
                  {/* <Route
                    path="/:dapplet_id/settings"
                    element={
                      <UserSettings userSettings={s.dappletUserSettings} />
                    }
                  ></Route> */}
                  <Route
                    path="/:dapplet_id"
                    element={
                      <>
                        {overlays.map((x) => (
                          <div
                            key={x.id}
                            className={cn(styles.noSystemDapplets, {
                              [styles.hideContent]: s.isSystemDapplets,

                              [styles.overlayActive]:
                                !s.isSystemDapplets && x.id === activeOverlayId,
                              // !isSettings && x.id === activeOverlayId,
                            })}
                          >
                            <ContentItem
                              overlay={x}
                              isActive={x.id === activeOverlayId}
                              overlayManager={p.overlayManager}
                            />
                          </div>
                        ))}
                      </>
                    }
                  />

                  {/* {overlays.map((x) => (
                    <div
                      key={x.id}
                      className={cn(styles.noSystemDapplets, {
                        [styles.hideContent]: s.isSystemDapplets,

                        [styles.overlayActive]:
                          !s.isSystemDapplets && x.id === activeOverlayId,
                        // !isSettings && x.id === activeOverlayId,
                      })}
                    >
                      <Route
                        path="/:dapplet_id/settings"
                        element={
                          <ContentItem
                            overlay={x}
                            isActive={x.id === activeOverlayId}
                            overlayManager={p.overlayManager}
                          />
                        }
                      ></Route>
                    </div>
                  ))} */}
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </MemoryRouter>
    )
  }
}
