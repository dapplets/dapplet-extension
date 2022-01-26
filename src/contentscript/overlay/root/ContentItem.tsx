import * as React from "react";
import { Overlay } from "./overlay";
import cn from "classnames";
import { OverlayManager } from "./overlayManager";

const OVERLAY_LOADING_TIMEOUT = 5000;

enum LoadingMode {
    NotLoading = 0,
    Loading = 1,
    SlowLoading = 2,
}

interface P {
    overlay: Overlay;
    isActive: boolean;
    overlayManager: OverlayManager;
}

interface S {
    loadingMode: LoadingMode;
}

export class ContentItem extends React.Component<P, S> {
    ref = React.createRef<HTMLDivElement>();
    timeoutId = setTimeout(
        () => this.setState({ loadingMode: LoadingMode.SlowLoading }),
        OVERLAY_LOADING_TIMEOUT
    );

    constructor(props: P) {
        super(props);

        this.state = {
            loadingMode: LoadingMode.Loading,
        };
    }

    componentDidMount() {
        this.ref.current.appendChild(this.props.overlay.frame);
        this.props.overlay.frame.addEventListener("load", () => {
            clearTimeout(this.timeoutId);
            this.setState({ loadingMode: LoadingMode.NotLoading });
        });

        // ToDo: popup
        const childrenOverlays = this.props.overlayManager.getOverlays().filter(x => x.parent === this.props.overlay);
        childrenOverlays.forEach(x => {
            this.ref.current.appendChild(x.frame);
        });
    }

    render() {
        const s = this.state;
        const p = this.props;
        const x = this.props.overlay;

        return (
            <div
                ref={this.ref}
                className={cn("dapplets-overlay-nav-content-item", {
                    "dapplets-overlay-nav-content-item-active": p.isActive,
                })}
            >
                {s.loadingMode === LoadingMode.Loading && (
                    <div className="loader-container">
                        <div className="flex">
                            <div className="loader"></div>
                        </div>
                        <div className="load-text">Loading Overlay...</div>
                        <div className="load-text">
                            Downloading from decentralized sources like Swarm or IPFS can take
                            some time
                        </div>
                    </div>
                )}

                {s.loadingMode === LoadingMode.SlowLoading && (
                    <div className="loader-container">
                        <div className="flex">
                            <div className="loader"></div>
                        </div>
                        <div className="load-text">Loading Overlay...</div>
                        <div className="load-text">
                            The overlay it is taking a while to load.
                        </div>
                        <div className="load-text-desc">
                            If the overlay does not load, try changing your preferred overlay
                            storage in the extension settings.
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
