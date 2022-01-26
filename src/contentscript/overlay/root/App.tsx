import * as React from "react";
import INNER_STYLE from "!raw-loader!./overlay.css";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ContentItem } from "./ContentItem";
import { TabItem } from "./TabItem";
import { OverlayManager } from "./overlayManager";

interface P {
    onToggle: () => void;
    overlayManager: OverlayManager;
}

interface S {
    isLoadingMap: { [overlayId: string]: boolean };
    isDevMode: boolean;
}

export class App extends React.Component<P, S> {
    private iframeRefs = new Map<string, HTMLIFrameElement>();

    constructor(props: P) {
        super(props);
        this.state = {
            isLoadingMap: Object.fromEntries(
                this.getOverlays().map((x) => [x.id, true])
            ),
            isDevMode: false
        };
    }

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
    };

    loadHandler = (overlayId: string) => {
        const { isLoadingMap } = this.state;
        isLoadingMap[overlayId] = false;
        this.setState({ isLoadingMap });
    };

    getOverlays() {
        return this.props.overlayManager.getOverlays();
    }

    render() {
        const p = this.props;
        const s = this.state;
        const overlays = this.getOverlays().filter(x => !x.parent);
        const activeOverlayId = p.overlayManager.activeOverlay?.id;

        return (
            <>
                <style>{INNER_STYLE}</style>
                <div className="dapplets-overlay-bucket-bar"></div>
                <div className="dapplets-overlay-toolbar">
                    <ul>
                        <li>
                            <button
                                title="Toggle Overlay"
                                className="dapplets-overlay-frame-button dapplets-overlay-frame-button-sidebar-toggle"
                                onClick={this.props.onToggle}
                            >
                                ⇄
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="dapplets-overlay-nav">
                    <div className="dapplets-overlay-nav-top-panel">
                        <div className="dapplets-overlay-nav-tab-list">
                            {overlays.map((x) => (
                                <TabItem
                                    key={x.id}
                                    overlay={x}
                                    isActive={x.id === activeOverlayId}
                                    onCloseClick={this.closeClickHandler}
                                    onTabClick={this.tabClickHandler}
                                />
                            ))}
                        </div>
                        <div className="dapplets-overlay-nav-top-actions">
                            <div className="dapplets-action-dropdown">
                                <button>
                                    <svg
                                        aria-hidden="true"
                                        focusable="false"
                                        data-prefix="fas"
                                        data-icon="bars"
                                        className="svg-inline--fa fa-bars fa-w-14"
                                        role="img"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 448 512"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"
                                        ></path>
                                    </svg>
                                </button>
                                <div>
                                    <div onClick={() => this.props.overlayManager.openPopup('dapplets')}>Dapplets</div>
                                    <div onClick={() => this.props.overlayManager.openPopup('wallets')}>Wallets</div>
                                    <div onClick={() => this.props.overlayManager.openPopup('settings')}>Settings</div>
                                    {s.isDevMode && <div onClick={() => this.props.overlayManager.openPopup('developer')}>Developer</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="dapplets-overlay-nav-content-list">
                        {overlays.map((x) => (
                            <ContentItem
                                overlay={x}
                                key={x.id}
                                isActive={x.id === activeOverlayId}
                                overlayManager={p.overlayManager}
                            />
                        ))}
                    </div>
                </div>
            </>
        );
    }
}
