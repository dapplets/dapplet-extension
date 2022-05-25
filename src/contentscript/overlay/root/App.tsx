import React from "react";
import styles from "./components/Overlay/Overlay.module.scss";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ContentItem } from "./components/ContentItem";
import { DAPPLETS_STORE_URL } from "../../../common/constants";
import { OverlayManager } from "./overlayManager";
import { OverlayToolbar } from "./components/OverlayToolbar";
import cn from "classnames";
import { Profile } from "./components/Profile";
import { SquaredButton } from "./components/SquaredButton";
import { ReactComponent as StoreIcon } from "./assets/svg/store.svg";
import { ReactComponent as SearchIcon } from "./assets/svg/magnifying-glass.svg";
import { ReactComponent as Home } from "./assets/svg/home-toolbar.svg";
import { ReactComponent as Settings } from "./assets/svg/setting-toolbar.svg";
import { ReactComponent as Notification } from "./assets/svg/notification.svg";
import { ReactComponent as Card } from "./assets/svg/card.svg";
import { ReactComponent as DappletsLogo } from "./assets/svg/dapplets-logo.svg";

import "@fontsource/roboto";
import "@fontsource/montserrat";
import { Dapplets } from "./pages/Dapplets";
import { Notifications } from "./pages/Notifications";
import { SettingsOverlay } from "./pages/Settings";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { Search } from "./components/Search";
import Wallets from "../../../popup/pages/wallets";
import {
    MemoryRouter,
    useNavigate,
    NavigateFunction,
    useLocation,
    Navigate,
} from "react-router-dom";
import { ToolbarTab, ToolbarTabMenu } from "./types";
import { groupBy } from "../../../common/helpers";
import { Overlay } from "./overlay";
import { UserSettings } from './pages/UserSettings';
import ManifestDTO from "../../../background/dto/manifestDTO";

export const withRouter = (Component) => {
    const Wrapper = (props) => {
        const navigate = useNavigate();
        const location = useLocation();

        if (location.pathname === "/") {
            return <Navigate to={"/system/dapplets"} replace />;
        }

        return <Component navigate={navigate} location={location} {...props} />;
    };

    return Wrapper;
};

TimeAgo.addLocale(en);

const SYSTEM_TAB: ToolbarTab = {
    id: "system",
    pinned: true,
    title: "Dapplets",
    icon: DappletsLogo,
    menus: [
        {
            id: "dapplets",
            icon: Home,
            title: "Dapplets",
        },
        {
            id: "notifications",
            icon: Notification,
            title: "Notifications",
        },
        {
            id: "settings",
            icon: Settings,
            title: "Settings",
        },
        {
            id: "wallet",
            icon: Card,
            title: "Wallet",
        },
    ],
};

interface P {
    onToggle: () => void;
    overlayManager: OverlayManager;
    navigate?: NavigateFunction;
    location?: Location;
}

interface S {
    isDevMode: boolean;
    isOpenSearch: boolean;
    search: string;
    internalTabs: ToolbarTab[];
}

class _App extends React.Component<P, S> {
    state: S = {
        isDevMode: false,
        isOpenSearch: false,
        search: "",
        internalTabs: []
    };

    async componentDidMount() {
        this.props.overlayManager.onActiveOverlayChanged = (
            overlay: Overlay
        ) => {
            const route = overlay
                ? `/${overlay.source}/${overlay.id}`
                : "/system/dapplets";
            this.props.navigate!(route);
        };
        
        const { getDevMode } = await initBGFunctions(browser);
        const isDevMode = await getDevMode();

        this.setState({ isDevMode });
    }

    componentWillUnmount() {
        this.props.overlayManager.onActiveOverlayChanged = null;
    }

    getTabs = (): ToolbarTab[] => {
        const overlays = this.getOverlays();
        const overlayGroups = groupBy(overlays, (x) => x.source);

        const tabs: ToolbarTab[] = [SYSTEM_TAB];

        for (const source in overlayGroups) {
            const group = overlayGroups[source];
            const tab: ToolbarTab = {
                id: source,
                icon: {
                    moduleName: group[0]?.module?.name,
                    registryUrl: group[0]?.module?.registryUrl
                },
                pinned: false,
                title: "",
                menus: [
                    ...group.map((x) => ({
                        id: x.id,
                        title: x.title,
                        icon: Home,
                    })),
                    {
                        id: "settings",
                        icon: Settings,
                        title: "User Settings",
                        props: {
                            moduleName: group[0]?.module?.name,
                            registryUrl: group[0]?.module?.registryUrl
                        }
                    },
                ],
            };
            tabs.push(tab);
        }

        tabs.push(...this.state.internalTabs);

        return tabs;
    };

    getOverlays() {
        return this.props.overlayManager.getOverlays().filter((x) => !x.parent);
    }

    handleCloseTabClick = async (tab: ToolbarTab) => {
        // remove external tabs
        const overlays = this.getOverlays();
        tab.menus.forEach((m) => overlays.find((x) => x.id === m.id)?.close());
        
        // remove internal tabs
        if (this.state.internalTabs.length > 0) {
            const beforeCount = this.state.internalTabs.length;
            const internalTabs = this.state.internalTabs.filter(x => x.id !== tab.id);
            const afterCount = internalTabs.length;
            this.setState({ internalTabs });
            
            if (beforeCount !== afterCount) {
                this.props.navigate!(`/system/dapplets`);
            }
        }
    };

    handleStoreButtonClick = () => {
        window.open(DAPPLETS_STORE_URL, "_blank");
    };

    handleTabMenuClick = (tab: ToolbarTab, menu?: ToolbarTabMenu) => {
        const menuId = menu?.id ?? tab.menus[0].id;
        this.props.navigate!(`/${tab.id}/${menuId}`);
    };

    handleOpenSearchClick = () => {
        this.setState({
            isOpenSearch: true,
        });
    };

    handleCloseSearch = () => {
        this.setState({
            isOpenSearch: false,
            search: "",
        });
    };

    handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ search: e.target.value });
    }

    handleSearchClear = () => {
        this.setState({ search: "" });
    }

    handleUserSettingsClick = (mi: ManifestDTO) => {
        const tab = this.getTabs().find(x => x.id === mi.name);
        
        if (!tab) {
            const internalTabs = [...this.state.internalTabs];
            internalTabs.push({
                id: mi.name,
                pinned: false,
                title: mi.title,
                icon: {
                    moduleName: mi.name,
                    registryUrl: mi.sourceRegistry.url
                },
                menus: [{
                    id: 'settings',
                    title: 'User Settings',
                    icon: Settings,
                    props: {
                        moduleName: mi.name,
                        registryUrl: mi.sourceRegistry.url
                    }
                }]
            });
            this.setState({ internalTabs });
        }

        this.props.navigate!(`/${mi.name}/settings`);
    }

    render() {
        const p = this.props;
        const s = this.state;
        const overlays = this.getOverlays();
        // TODO: naming wallets is the notification
        const { pathname } = this.props.location!;

        const activeTabId = pathname.split("/")[1];
        const activeTabMenuId = pathname.split("/")[2];

        const tab = this.getTabs().find(x => x.id === activeTabId);
        const menu = tab?.menus.find(x => x.id === activeTabMenuId);

        return (
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
                    />

                    <div className={styles.inner}>
                        <header className={styles.header}>
                            <div className={styles.left}>
                                <Profile
                                    mini
                                    avatar="https://gafki.ru/wp-content/uploads/2019/11/kartinka-1.-aljaskinskij-malamut.jpg"
                                    hash="0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa"
                                />
                            </div>
                            <div className={styles.right}>
                                <SquaredButton
                                    appearance="big"
                                    icon={StoreIcon}
                                    onClick={this.handleStoreButtonClick}
                                />
                                {!s.isOpenSearch &&
                                    pathname === "/system/dapplets" && (
                                        <SquaredButton
                                            onClick={this.handleOpenSearchClick}
                                            appearance="big"
                                            icon={SearchIcon}
                                        />
                                    )}

                                {s.isOpenSearch &&
                                    pathname === "/system/dapplets" && (
                                        <div
                                            className={styles.searchBlock}
                                            tabIndex={1}
                                        >
                                            <Search
                                                value={s.search}
                                                onChange={
                                                    this.handleSearchChange
                                                }
                                                onClearValue={
                                                    this.handleSearchClear
                                                }
                                                onCloseSearch={
                                                    this.handleCloseSearch
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                        </header>

                        <div
                            onClick={() => this.handleCloseSearch()}
                            className={cn(
                                styles.children,
                                "dapplets-overlay-nav-content-list"
                            )}
                        >
                            {pathname === "/system/dapplets" && (
                                <Dapplets search={s.search} onUserSettingsClick={this.handleUserSettingsClick}/>
                            )}

                            {pathname === "/system/notifications" && (
                                <Notifications />
                            )}

                            {pathname === "/system/settings" && (
                                <SettingsOverlay />
                            )}

                            {pathname === "/system/wallet" && (
                                <Wallets isOverlay={true} />
                            )}

                            {overlays.map((x) => (
                                <ContentItem
                                    overlay={x}
                                    isActive={
                                        pathname === `/${x.source}/${x.id}`
                                    }
                                    overlayManager={p.overlayManager}
                                    key={x.id}
                                />
                            ))}

                            {activeTabId !== 'system' && activeTabMenuId === 'settings' && menu && (
                                <UserSettings dappletName={activeTabId} registryUrl={menu.props!.registryUrl} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const __App = withRouter(_App);

export const App = (props: any) => (
    <MemoryRouter>
        <__App {...props} />
    </MemoryRouter>
);
