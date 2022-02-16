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
import { MENU } from "./components/Overlay/navigation-list";
import { TSelectedSettings } from "./types/SelectedSettings";

interface P {
  onToggle: () => void;
  overlayManager: OverlayManager;
}

interface S {
  isLoadingMap: { [overlayId: string]: boolean };
  isDevMode: boolean;
  selectedMenu: TSelectedSettings;
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
    isDevMode: false,
    selectedMenu: "Dapplets",
  };

  async componentDidMount() {
    const { getDevMode } = await initBGFunctions(browser);
    const isDevMode = await getDevMode();
    this.setState({ isDevMode });
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
                {overlays.map((x) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
