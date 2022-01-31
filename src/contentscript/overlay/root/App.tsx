import * as React from "react";
//import INNER_STYLE from "!raw-loader!./overlay.css";
import styles from "./components/Overlay/Overlay.module.scss";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { ContentItem } from "./ContentItem";
import { TabItem } from "./TabItem";
import { OverlayManager } from "./overlayManager";
import { OverlayToolbar } from "./components/OverlayToolbar";
import cn from 'classnames';
import { ReactNode } from "react";

interface P {
    onToggle: () => void;
    overlayManager: OverlayManager;
}

interface S {
    isLoadingMap: { [overlayId: string]: boolean };
    isDevMode: boolean;
}

export interface ITab {
    id: number;
    name: string;
    notification: boolean;
}

export type TSelectedSettings = "Dapplets" | "Wallets" | "Settings" | "Developer";

export interface OverlayProps {
    children?: ReactNode;
    baseNameSelectedSetting?: TSelectedSettings;
}


const TABS = [
    { id: 0, name: "Dapplets", notification: false },
    { id: 1, name: "Wallets", notification: false },
    { id: 2, name: "Settings", notification: false },
    { id: 3, name: "Developer", notification: false },
];

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
                {/*<style>{styles}</style>*/}
                <div
                    className={cn("overlay", {
                        //[styles.show]: isShow,
                    })}
                >
                    <div className={"wrapper"}>
                        <OverlayToolbar
                            tabs={TABS}
                            className={styles.toolbar}
                            nameSelectedSetting="Dapplets"
                            idSelectedTab={0}
                            //onNameSelectedSetting={onNameSelectedSetting}
                            //onIdSelectedChange={onIdSelectedChange}
                            //onRemoveTag={onRemoveTag}
                            toggle={this.props.onToggle}
                        />

                        <div className={styles.inner}>
                            {/*<header className={styles.header}>
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
					</header>*/}

                            <div className={styles.children}>
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
                    </div>
                </div>
            </>
        );
    }
}
