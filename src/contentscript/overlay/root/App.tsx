import React from "react";
import styles from "./components/Overlay/Overlay.module.scss";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ContentItem } from "./ContentItem";
import { OverlayManager } from "./overlayManager";
import { OverlayToolbar } from "./components/OverlayToolbar";
import cn from 'classnames';
import { ReactNode } from "react";
import { Profile } from "./components/Profile";
import { SquaredButton } from "./components/SquaredButton";
import { Icon } from "./components/Icon";
import { ReactComponent as StoreIcon } from "./assets/svg/store.svg";
import { ReactComponent as SearchIcon } from "./assets/svg/magnifying-glass.svg";
import { ReactComponent as EthereumIcon } from "./assets/icons/ephir.svg";
import { ReactComponent as Home } from "./assets/svg/home-toolbar.svg";
import { ReactComponent as Settings } from "./assets/svg/setting-toolbar.svg";
import { ReactComponent as Notification } from "./assets/svg/notification.svg";
import { ReactComponent as Airplay } from "./assets/svg/airplay.svg";
import { IMenu } from "./models/menu.model";
import { ManifestAndDetails } from "../../../popup/components/dapplet";

import '@fontsource/roboto';
import '@fontsource/montserrat';
import { Dapplets } from "./pages/Dapplets";

export type TSelectedSettings = "Dapplets" | "Wallets" | "Settings" | "Developer";

const MENU: IMenu[] = [
  { _id: "0", icon: Home, title: "Dapplets" },
  { _id: "1", icon: Notification, title: "Wallets" },
  { _id: "2", icon: Settings, title: "Settings" },
  { _id: "3", icon: Airplay, title: "Developer" },
]

interface P {
  onToggle: () => void;
  overlayManager: OverlayManager;
}

interface S {
  isLoadingMap: { [overlayId: string]: boolean };
  isDevMode: boolean;
  selectedMenu: TSelectedSettings;
  dapplets: ManifestAndDetails[];
}

export interface OverlayProps {
  children?: ReactNode;
  baseNameSelectedSetting?: TSelectedSettings;
}

export class App extends React.Component<P, S> {
  state: S = {
    isLoadingMap: Object.fromEntries(
      this.getOverlays().map((x) => [x.id, true])
    ),
    dapplets: [],
    isDevMode: false,
    selectedMenu: "Dapplets",
  };

  async componentDidMount() {
    const { getDevMode, getFeaturesByHostnames, getCurrentContextIds } = await initBGFunctions(browser);
    const ids = await getCurrentContextIds();
    const isDevMode = await getDevMode();
    const dapplets = await getFeaturesByHostnames(ids);

    this.setState({ isDevMode, dapplets });
  }

  closeClickHandler = (overlayId: string) => {
    const overlay = this.getOverlays().find((x) => x.id === overlayId);
    overlay.close();
  };

  tabClickHandler = (overlayId: string) => {
    const overlay = this.getOverlays().find((x) => x.id === overlayId);
    if (!overlay) return;
    this.props.overlayManager.activate(overlay);
    this.setState({ selectedMenu: "Dapplets" });
  };

  loadHandler = (overlayId: string) => {
    const { isLoadingMap } = this.state;
    isLoadingMap[overlayId] = false;
    this.setState({ isLoadingMap });
  };

  getOverlays() {
    return this.props.overlayManager.getOverlays();
  }

  createTab = (overlayName: string) => {
    return this.props.overlayManager.openPopup(overlayName);
  }

  onSelectedMenu = (name: string) => {
    this.setState({ selectedMenu: name as TSelectedSettings });

    const overlays = this.getOverlays();
    const overlay = overlays.find((item) => item.title === name);

    if (!overlay) return this.createTab(name.toLowerCase());
    return this.props.overlayManager.activate(overlay);
  }

  getTabs = () => this
    .getOverlays()
    .filter(x => x.uri.includes("/popup.html#/dapplets")
      ? x
      : !x.uri.includes("/popup.html#"));


  render() {
    const p = this.props;
    const s = this.state;
    const overlays = this.getOverlays().filter(x => !x.parent);
    const activeOverlayId = p.overlayManager.activeOverlay?.id;
    console.log('overlays:', overlays);

    return (
      <>
        <div className={cn(styles.overlay)}>

          <div className={styles.wrapper}>
            <OverlayToolbar
              tabs={overlays}
              menu={MENU}
              className={styles.toolbar}
              nameSelectedMenu={s.selectedMenu}
              idActiveTab={activeOverlayId}
              isDevMode={this.state.isDevMode}
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
                  <SquaredButton appearance="big" icon={StoreIcon} />
                  <SquaredButton appearance="big" icon={SearchIcon} />
                </div>
              </header>

              <div className={cn(styles.children, "dapplets-overlay-nav-content-list")}>
                <Dapplets dapplets={s.dapplets} />

                {/*{overlays.map((x) => (
                  <div key={x.id}
                    className={cn(styles.overlayInner, {
                      [styles.overlayActive]: x.id === activeOverlayId
                    })}
                  >
                    <ContentItem
                      overlay={x}
                      isActive={x.id === activeOverlayId}
                      overlayManager={p.overlayManager}
                    />
                  </div>
                ))}*/}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
