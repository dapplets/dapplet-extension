import * as React from "react";
import { Overlay } from "./overlay";
import cn from "classnames";
import { OverlayManager } from "./overlayManager";
import { PopupItem } from './PopupItem';

const OVERLAY_LOADING_TIMEOUT = 5000;

enum LoadingMode {
    NotLoading = 0,
    Loading = 1,
    SlowLoading = 2,
    NetworkError = 3,
    ServerError = 4
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

    constructor(props: P) {
        super(props);

        this.state = {
            loadingMode: LoadingMode.Loading,
        };
    }

    componentDidMount() {
        this.loadFrame();
    }

    loadFrame() {
        const timeoutId = setTimeout(
            () => this.setState({ loadingMode: LoadingMode.SlowLoading }),
            OVERLAY_LOADING_TIMEOUT
        );

        const overlay = this.props.overlay;
        overlay.checkAvailability();

        this.setState({ loadingMode: LoadingMode.Loading });
        
        this.ref.current.appendChild(overlay.frame);
        
        const loadHandler = () => {
            clearTimeout(timeoutId);
            if (!overlay.isError) {
                this.setState({ loadingMode: LoadingMode.NotLoading });
            }
            overlay.frame.removeEventListener("load", loadHandler);
        };
        overlay.frame.addEventListener("load", loadHandler);

        const networkErrorHandler = () => {
            clearTimeout(timeoutId);
            overlay.frame.remove();
            this.setState({ loadingMode: LoadingMode.NetworkError });
            overlay.frame.removeEventListener("error_network", networkErrorHandler);
        };
        overlay.frame.addEventListener("error_network", networkErrorHandler);
        
        const serverErrorHandler = () => {
            clearTimeout(timeoutId);
            overlay.frame.remove();
            this.setState({ loadingMode: LoadingMode.ServerError });
            overlay.frame.removeEventListener("error_server", serverErrorHandler);
        };
        overlay.frame.addEventListener("error_server", serverErrorHandler);
    }

    render() {
        const s = this.state;
        const p = this.props;
        const x = this.props.overlay;

        const childrenOverlays = p.overlayManager.getOverlays().filter(x => x.parent === p.overlay);

        return (
            <div
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

                {s.loadingMode === LoadingMode.NetworkError && (
                    <div className="loader-container" style={{ zIndex: 1 }}>
                        <div className="load-text">No Internet Connection</div>
                        <div className="load-text">
                            Please check your internet connection and try again
                        </div>
                        <div className="load-text">
                            <button onClick={this.loadFrame.bind(this)}>Try again</button>
                        </div>
                    </div>
                )}

                {s.loadingMode === LoadingMode.ServerError && (
                    <div className="loader-container" style={{ zIndex: 1 }}>
                        <div className="load-text">Internal Server Error</div>
                        <div className="load-text">
                            Sorry, there were some technical issues while processing your request.
                            You can change preferred overlay storage and try again.
                        </div>
                        <div className="load-text">
                            <button onClick={this.loadFrame.bind(this)}>Try again</button>
                        </div>
                    </div>
                )}

                <div className="frame-container" ref={this.ref}></div>

                {childrenOverlays.map(x => <PopupItem key={x.id} overlay={x} />)}
            </div>
        );
    }
}
