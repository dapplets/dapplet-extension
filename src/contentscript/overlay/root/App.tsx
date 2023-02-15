import '@fontsource/montserrat'
import '@fontsource/roboto'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React from 'react'
import {
  MemoryRouter,
  Navigate,
  NavigateFunction,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { browser } from 'webextension-polyfill-ts'
import ManifestDTO from '../../../background/dto/manifestDTO'
import { Bus } from '../../../common/bus'
import { DAPPLETS_STORE_URL } from '../../../common/constants'
import * as EventBus from '../../../common/global-event-bus'
import { groupBy } from '../../../common/helpers'

import { ReactComponent as Notification } from './assets/newIcon/bell.svg'
import { ReactComponent as Account } from './assets/newIcon/connected.svg'
import { ReactComponent as Hide } from './assets/newIcon/hide.svg'
import { ReactComponent as Settings } from './assets/newIcon/mainset.svg'
import { ReactComponent as DappletsLogo } from './assets/newIcon/mustache.svg'
import { ReactComponent as SearchIcon } from './assets/newIcon/search.svg'
import { ReactComponent as Home } from './assets/newIcon/squares.svg'
import { ReactComponent as StoreIcon } from './assets/newIcon/store.svg'
import { ContentItem } from './components/ContentItem'
import styles from './components/Overlay/Overlay.module.scss'
import { OverlayTab } from './components/OverlayTab'
import { OverlayToolbar } from './components/OverlayToolbar'
import { PopupItem } from './components/PopupItem'
import { Profile } from './components/Profile'
import { Search } from './components/Search'
import { ShareButton } from './components/ShareButton'
import { SquaredButton } from './components/SquaredButton'
import { SystemPopup } from './components/SystemPopup'
import { Overlay } from './overlay'
import { OverlayManager } from './overlayManager'
import { ConnectedAccount } from './pages/ConnectedAccount'
import { Dapplets } from './pages/Dapplets'
import { Notifications } from './pages/Notifications'
import { SettingsOverlay } from './pages/Settings'
import { UserSettings } from './pages/UserSettings'
import { ToolbarTab, ToolbarTabMenu } from './types'

export const withRouter = (Component) => {
  const Wrapper = (props) => {
    const navigate = useNavigate()
    const location = useLocation()

    if (location.pathname === '/') {
      return <Navigate to={'/system/dapplets'} replace />
    }

    return <Component navigate={navigate} location={location} {...props} />
  }

  return Wrapper
}

TimeAgo.addLocale(en)

const SYSTEM_TAB: ToolbarTab = {
  id: 'system',
  pinned: true,
  title: 'Dapplets',
  icon: DappletsLogo,
  menus: [
    {
      id: 'dapplets',
      icon: Home,
      title: 'Dapplets',
    },
    {
      id: 'notifications',
      icon: Notification,
      title: 'Notifications',
    },
    {
      id: 'connectedAccounts',
      icon: Account,
      title: 'Connected Accounts',
    },
    {
      id: 'settings',
      icon: Settings,
      title: 'Settings',
    },
  ],
}

interface P {
  hidden: boolean
  onToggle: () => void
  overlayManager: OverlayManager
  navigate?: NavigateFunction
  location?: Location
  systemPopupEventBus: Bus
}

interface S {
  isDevMode: boolean
  isOpenSearch: boolean
  search: string
  internalTabs: ToolbarTab[]
  isWalletConnect: boolean
  isWalletLength: boolean
  isOpenWallet: boolean
  classNameSearch: string
  classNameSearchButton: string
  isLoadingDeploy: boolean
  dropdownListValue: string
  isMiniWallets: boolean
  connectedDescriptors: []
  selectedWallet: string
  module: any
}

class _App extends React.Component<P, S> {
  state: S = {
    isDevMode: false,
    isOpenSearch: false,
    search: '',
    internalTabs: [],
    isWalletConnect: false,
    isWalletLength: false,
    isOpenWallet: false,
    classNameSearch: '',
    classNameSearchButton: '',
    isLoadingDeploy: false,
    dropdownListValue: 'all',
    isMiniWallets: false,
    connectedDescriptors: null,
    selectedWallet: null,
    module: null,
  }

  async componentDidMount() {
    this.props.overlayManager.onActiveOverlayChanged = (overlay: Overlay) => {
      if (overlay && overlay.registered) {
        const route = `/${overlay.source ? overlay.source : overlay.id}/${overlay.id}`
        this.props.navigate!(route)
      } else {
        // no iframe tabs
        const { pathname } = this.props.location!
        const activeTabId = pathname.split('/')[1]
        const activeTabMenuId = pathname.split('/')[2]

        // do not redirect if dapplet' settings is opened
        if (activeTabId !== 'system' && activeTabMenuId === 'settings') {
          return
        }

        // do not redirect if system tab is opened
        if (activeTabId === 'system') {
          return
        }

        // redirect to default page
        this.props.navigate!(`/system/dapplets`)
      }
    }

    const { getDevMode } = await initBGFunctions(browser)
    const isDevMode = await getDevMode()

    // ToDo: rethink overlay update when background state changes
    EventBus.on('dapplet_deactivated', this.handleDappletDeactivated)

    this.setState({ isDevMode })
  }

  handleDappletDeactivated = (dapplet: any) => {
    // close tabs of deactivated dapplets (including their settings)
    const tabsToBeClosed = this.getTabs().filter((x) => x.id === dapplet.name)
    tabsToBeClosed.forEach((tab) => this.handleCloseTabClick(tab))
  }

  componentWillUnmount() {
    this.props.overlayManager.onActiveOverlayChanged = null
    EventBus.off('dapplet_deactivated', this.handleDappletDeactivated)
  }

  getTabs = (): ToolbarTab[] => {
    const overlays = this.getOverlays()
    const overlayGroups = groupBy(overlays, (x) => x.source)

    const tabs: ToolbarTab[] = [SYSTEM_TAB]

    for (const source in overlayGroups) {
      const group = overlayGroups[source].filter((x) => !x.isSystemPopup)

      // system legacy tab
      if (source === 'null') {
        for (const overlay of group) {
          const tab: ToolbarTab = {
            id: overlay.id,
            icon: null,
            pinned: false,
            title: overlay.title,
            menus: [
              {
                id: overlay.id,
                icon: null,
                title: overlay.title,
                hidden: false,
              },
            ],
          }

          tabs.push(tab)
        }
      } else {
        const tab: ToolbarTab = {
          id: source,
          icon: {
            moduleName: group[0]?.module?.name,
            registryUrl: group[0]?.module?.registryUrl,
          },
          pinned: false,
          title: '',
          menus: [
            ...group.map((x) => {
              return {
                id: x.id,
                title: x.title,
                icon: Home,
              }
            }),
            {
              id: 'settings',
              icon: Settings,
              title: 'User Settings',
              props: {
                moduleName: group[0]?.module?.name,
                registryUrl: group[0]?.module?.registryUrl,
                id: group[0].id,
              },
            },
          ],
        }

        tabs.push(tab)
      }
    }

    for (const internalTab of this.state.internalTabs) {
      const existingTab = tabs.find((x) => x.id === internalTab.id)

      if (existingTab) {
        for (const menu of internalTab.menus) {
          if (!existingTab.menus.find((x) => x.id === menu.id)) {
            existingTab.menus.push(menu)
          }
        }
      } else {
        tabs.push(internalTab)
      }
    }

    return tabs
  }

  getOverlays() {
    return this.props.overlayManager.getOverlays().filter((x) => !x.parent)
  }

  handleCloseTabClick = async (tab: ToolbarTab) => {
    // remove external tabs
    const overlays = this.getOverlays()
    tab.menus.forEach((m) => overlays.find((x) => x.id === m.id)?.close())

    // remove internal tabs
    if (this.state.internalTabs.length > 0) {
      const internalTabs = this.state.internalTabs.filter((x) => x.id !== tab.id)
      this.setState({ internalTabs })

      const { pathname } = this.props.location!
      const activeTabId = pathname.split('/')[1]

      // redirect to default page if an active tab was closed
      if (activeTabId === tab.id) {
        this.props.navigate!(`/system/dapplets`)
      }
    }
  }

  handleStoreButtonClick = () => {
    window.open(DAPPLETS_STORE_URL, '_blank')
  }

  handleTabMenuClick = async (tabs: ToolbarTab, menu?: ToolbarTabMenu) => {
    const menuId = menu?.id ?? tabs.menus[0].id
    !document
      .querySelector('#dapplets-overlay-manager')
      .classList.contains('dapplets-overlay-collapsed') &&
      this.props.navigate!(`/${tabs.id}/${menuId}`)
  }

  handleOpenSearchClick = () => {
    this.setState({
      isOpenSearch: true,
      // isMiniWallets: true,
    })
  }

  handleCloseSearch = () => {
    this.setState({
      isMiniWallets: false,
      classNameSearch: 'close',
    })
    setTimeout(() => {
      this.setState({
        isOpenSearch: false,
        search: '',
        classNameSearch: '',
      })
    }, 200)
    setTimeout(() => {
      this.setState({
        classNameSearchButton: 'closeSearch',
      })
    }, 500)
    setTimeout(() => {
      this.setState({
        classNameSearchButton: '',
      })
    }, 500)
  }

  handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ search: e.target.value })
  }

  handleSearchClear = () => {
    this.setState({ search: '' })
  }

  handleUserSettingsClick = (mi: ManifestDTO) => {
    const tab = this.getTabs().find((x) => x.id === mi.name)

    if (!tab) {
      const internalTabs = [...this.state.internalTabs]
      internalTabs.push({
        id: mi.name,
        pinned: false,
        title: mi.title,
        icon: {
          moduleName: mi.name,
          registryUrl: mi.sourceRegistry.url,
        },
        menus: [
          {
            id: 'settings',
            title: 'User Settings',
            icon: Settings,
            props: {
              moduleName: mi.name,
              registryUrl: mi.sourceRegistry.url,
            },
          },
        ],
      })
      this.setState({ internalTabs })
    }

    this.props.navigate!(`/${mi.name}/settings`)
  }

  getTabsForDapplet = (mi: ManifestDTO) => {
    const tab = this.getTabs().find((x) => x.id === mi.name)

    if (!tab) {
      const internalTabs = [...this.state.internalTabs]
      internalTabs.push({
        id: mi.name,
        pinned: false,
        title: mi.title,
        icon: {
          moduleName: mi.name,
          registryUrl: mi.sourceRegistry.url,
        },
        menus: [
          {
            id: 'settings',
            title: 'User Settings',
            icon: Settings,
            props: {
              moduleName: mi.name,
              registryUrl: mi.sourceRegistry.url,
            },
          },
        ],
      })
      this.setState({ internalTabs })
    }
  }

  handleWalletConnect = () => {
    this.setState({ isWalletConnect: !this.state.isWalletConnect })
  }

  handleWalletLengthConnect = () => {
    this.setState({ isWalletLength: true })
  }
  handleWalletLengthDisconnect = () => {
    this.setState({ isWalletLength: false })
  }
  setOpenWallet = () => {
    this.setState({
      isOpenWallet: !this.state.isOpenWallet,
      isOpenSearch: !this.state.isOpenWallet === true ? false : this.state.isOpenSearch,
      search: '',
      isMiniWallets: !this.state.isMiniWallets,
    })
  }
  closeOpenWallet = () => {
    this.setState({
      isOpenWallet: false,
      isMiniWallets: false,
      isOpenSearch: false,
    })
  }

  setLoadingDeploy = () => {
    this.setState({ isLoadingDeploy: true })
  }
  setLoadingDeployFinally = () => {
    this.setState({ isLoadingDeploy: false })
  }
  setDropdownListValue = (value: string) => {
    this.setState({ dropdownListValue: value })
  }
  setOpenWalletMini = () => {
    this.setState({
      isMiniWallets: false,
    })
  }
  setConnectedDescriptors = (descriptors: []) => {
    this.setState({
      connectedDescriptors: descriptors,
    })
  }
  setSelectedWallet = (selectedWallet: string) => {
    this.setState({
      selectedWallet: selectedWallet,
    })
  }
  setModule = (module: []) => {
    this.setState({
      module: module,
    })
  }

  getNewButtonTab = (parametersFilter: string) => {
    const clone = Object.assign({}, SYSTEM_TAB)
    const newSystemTab = [clone]
    const newSet = newSystemTab.map((tab) => {
      const NewTabs = tab
      const filterTab = NewTabs.menus.filter((f) => f.title === parametersFilter)
      const newTab = NewTabs
      newTab.menus = filterTab
      const { pathname } = this.props.location!
      const activeTabId = pathname.split('/')[1]
      const activeTabMenuId = pathname.split('/')[2]
      return (
        <OverlayTab
          key={NewTabs.id}
          {...newTab}
          isActive={activeTabId === NewTabs.id}
          navigate={this.props.navigate!}
          activeTabMenuId={activeTabMenuId}
          onCloseClick={() => this.handleCloseTabClick(NewTabs)}
          onMenuClick={(menu) => this.handleTabMenuClick(NewTabs, menu)}
          onTabClick={() => this.handleTabMenuClick(NewTabs)}
          classNameTab={
            parametersFilter === 'Connected Accounts'
              ? styles.overlayTabWrapperAccounts
              : styles.overlayTabWrapper
          }
          classNameIcon={styles.overlayTabIcon}
          classNameList={styles.overlayTabList}
          classNameItem={styles.overlayTabItem}
        />
      )
    })
    return newSet
  }

  render() {
    const p = this.props
    const s = this.state

    // if (p.hidden) return null

    const overlays = this.getOverlays()
    // TODO: naming wallets is the notification
    const { pathname } = this.props.location!

    const activeTabId = pathname.split('/')[1]
    const activeTabMenuId = pathname.split('/')[2]

    const tab = this.getTabs().find((x) => x.id === activeTabId)
    const menu = tab?.menus.find((x) => x.id === activeTabMenuId)

    const systemPopups = overlays.filter((x) => x.isSystemPopup)

    return (
      <>
        <SystemPopup bus={p.systemPopupEventBus} />

        <div className={cn(styles.overlay)}>
          <div className={styles.wrapper}>
            <OverlayToolbar
              className={styles.toolbar}
              tabs={this.getTabs()}
              onTabClick={this.handleTabMenuClick}
              onCloseClick={this.handleCloseTabClick}
              onMenuClick={this.handleTabMenuClick}
              onToggleClick={this.props.onToggle}
              activeTabId={activeTabId}
              activeTabMenuId={activeTabMenuId}
              setOpenWallet={this.setOpenWallet}
              isOpenWallet={s.isOpenWallet}
              navigate={this.props.navigate!}
              pathname={pathname}
              module={s.module}
              overlays={overlays}
              selectedWallet={this.state.selectedWallet}
              connectedDescriptors={this.state.connectedDescriptors}
            />

            <div className={styles.inner}>
              <header className={styles.header}>
                <div className={styles.left}>
                  <SquaredButton
                    title="hide"
                    // className={s.classNameSearchButton}
                    onClick={this.props.onToggle}
                    appearance="big"
                    icon={Hide}
                    dataTestid="minimize-overlay-button"
                  />
                  <Profile
                    setSelectedWallet={this.setSelectedWallet}
                    setConnectedDescriptors={this.setConnectedDescriptors}
                    isMini={s.isMiniWallets}
                    handleWalletLengthConnect={this.handleWalletLengthConnect}
                    isWalletLength={s.isWalletLength}
                    handleWalletConnect={this.handleWalletConnect}
                    isOverlay={true}
                    setOpenWallet={this.setOpenWallet}
                    isOpenWallet={s.isOpenWallet}
                    setOpenWalletMini={this.setOpenWalletMini}
                    // isOpenSearch={s.isOpenSearch}
                  />
                  {this.getNewButtonTab('Connected Accounts')}
                </div>

                <div className={styles.right}>
                  {pathname === '/system/dapplets' && (
                    <SquaredButton
                      title="Search dapplets"
                      className={s.classNameSearchButton}
                      onClick={() =>
                        s.isOpenSearch ? this.handleCloseSearch() : this.handleOpenSearchClick()
                      }
                      appearance="big"
                      icon={SearchIcon}
                    />
                  )}

                  {this.getNewButtonTab('Notifications')}

                  <SquaredButton
                    appearance="big"
                    title="Dapplets Store"
                    icon={StoreIcon}
                    onClick={this.handleStoreButtonClick}
                  />
                  <ShareButton />
                  {this.getNewButtonTab('Settings')}
                </div>
              </header>
              {s.isOpenSearch && pathname === '/system/dapplets' && (
                <div className={styles.searchBlock} tabIndex={1}>
                  <Search
                    className={s.classNameSearch}
                    value={s.search}
                    isOpenSearch={s.isOpenSearch}
                    onChange={this.handleSearchChange}
                    onClearValue={this.handleSearchClear}
                    onCloseSearch={this.handleCloseSearch}
                  />
                </div>
              )}
              <div
                onClick={() => this.handleCloseSearch()}
                className={cn(styles.children, 'dapplets-overlay-nav-content-list', {
                  [styles.newChildren]:
                    pathname !== '/system/dapplets' &&
                    pathname !== '/system/notifications' &&
                    pathname !== '/system/connectedAccounts' &&
                    pathname !== '/system/settings',
                  // [styles.newHeight]:s.isOpenSearch && pathname === '/system/dapplets'
                })}
              >
                {pathname === '/system/dapplets' && (
                  <Dapplets
                    search={s.search}
                    onUserSettingsClick={this.handleUserSettingsClick}
                    setDropdownListValue={this.setDropdownListValue}
                    dropdownListValue={s.dropdownListValue}
                    getTabsForDapplet={this.getTabsForDapplet}
                    handleCloseTabClick={this.handleCloseTabClick}
                    tabs={this.getTabs()}
                    setModule={this.setModule}
                    classNameBlock={
                      s.isOpenSearch && pathname === '/system/dapplets' ? styles.newHeight : null
                    }
                  />
                )}

                {pathname === '/system/notifications' && <Notifications />}
                {pathname === '/system/connectedAccounts' && <ConnectedAccount />}
                {pathname === '/system/settings' && (
                  <SettingsOverlay
                    selectedWallet={s.selectedWallet}
                    connectedDescriptors={s.connectedDescriptors}
                    setOpenWallet={this.setOpenWallet}
                    isLoadingDeploy={s.isLoadingDeploy}
                    setLoadingDeploy={this.setLoadingDeploy}
                    setLoadingDeployFinally={this.setLoadingDeployFinally}
                  />
                )}

                {overlays
                  .filter((x) => !x.isSystemPopup)
                  .map((x) => {
                    return (
                      <ContentItem
                        overlay={x}
                        isActive={pathname === `/${x.source ? x.source : x.id}/${x.id}`}
                        overlayManager={p.overlayManager}
                        key={x.id}
                        module={s.module}
                        onSettingsModule={this.handleUserSettingsClick}
                      />
                    )
                  })}

                {activeTabId !== 'system' && activeTabMenuId === 'settings' && menu && (
                  <UserSettings
                    navigation={p.navigate}
                    overlays={overlays}
                    module={s.module}
                    dappletName={activeTabId}
                    registryUrl={menu.props!.registryUrl}
                  />
                )}

                {systemPopups.map((x) => (
                  <PopupItem key={x.id} overlay={x} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}

const __App = withRouter(_App)

export const App = (props: any) => (
  <MemoryRouter>
    <__App {...props} />
  </MemoryRouter>
)
