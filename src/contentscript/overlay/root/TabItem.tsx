import * as React from "react";
import { Overlay } from "./overlay";
import cn from "classnames";

interface P {
    overlay: Overlay;
    isActive: boolean;
    onCloseClick: (overlayId: string) => void;
    onTabClick: (overlayId: string) => void;
}

export const TabItem: React.FunctionComponent<P> = (p) => {
    const clickHandler = (e) => {
        e.cancelBubble = true;
        e.stopPropagation();
        p.onTabClick(p.overlay.id);
    };
    return (
        <div
            className={cn("dapplets-overlay-nav-tab-item", {
                "dapplets-overlay-nav-tab-item-active": p.isActive,
            })}
            key={p.overlay.id}
            onClick={clickHandler}
        >
            <div
                title={p.overlay.title}
                className="dapplets-overlay-nav-tab-item-title"
            >
                {p.overlay.title}
            </div>
            <div
                className="dapplets-overlay-nav-tab-item-close-btn"
                onClick={() => p.onCloseClick(p.overlay.id)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="4 4 16 16"
                    style={{ width: "10px" }}
                >
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                </svg>
            </div>
        </div>
    );
};
