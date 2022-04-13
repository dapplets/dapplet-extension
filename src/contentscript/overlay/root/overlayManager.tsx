import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { capitalizeFirstLetter } from "../../../common/helpers";
import { Overlay } from "./overlay";
import { IOverlayManager } from "../interfaces";
import { JsonRpc } from "../../../common/jsonrpc";
import { App } from "./App";

const CollapsedOverlayClass = "dapplets-overlay-collapsed";
const HiddenOverlayClass = "dapplets-overlay-hidden";
const DappletsOverlayManagerClass = "dapplets-overlay-manager";
const OverlayFrameClass = "dapplets-overlay-frame";

export class OverlayManager implements IOverlayManager {
    private _panel: HTMLElement = null;
    public activeOverlay: Overlay = null;

    private _shadow = null;

    private _tabsRegistry: {
        overlay: Overlay;
    }[] = [];

    public ref = React.createRef<any>();

    constructor(private _iframeMessenger: JsonRpc) {
        // Side panel
        const panel = document.createElement(DappletsOverlayManagerClass);
        panel.classList.add(
            OverlayFrameClass,
            CollapsedOverlayClass,
            HiddenOverlayClass
        );
        this._panel = panel;

        this._shadow = panel.attachShadow({ mode: "open" });

        this._render();

        // // const avatarAction = document.createElement("div");
        // // avatarAction.innerHTML = `
        // //     <button>
        // //         <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-circle" class="svg-inline--fa fa-user-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>
        // //     </button>
        // //     <div>
        // //         <a href="#">Account Groups</a>
        // //         <a href="#">Logout</a>
        // //     </div>
        // // `;
        // // avatarAction.classList.add('dapplets-action-dropdown');
        // // avatarAction.addEventListener('click', (e) => {
        // //     if ((e.target as any).innerText === 'Account Groups') {
        // //         const url = browser.runtime.getURL('identity.html');
        // //         this._identityOverlay = this._identityOverlay ?? this.createNewOverlay(url, 'Identity');
        // //         this._identityOverlay.open();
        // //     }
        // // });
        // // topActions.appendChild(avatarAction);

        document.body.appendChild(panel);
    }

    /**
     * Expands the panel.
     */
    public open() {
        this._panel.classList.remove(CollapsedOverlayClass);
    }

    /**
     * Collapses the panel.
     */
    public close() {
        this._panel.classList.add(CollapsedOverlayClass);
    }

    /**
     * Shows the panel.
     */
    public show() {
        this._panel.classList.remove(HiddenOverlayClass);
    }

    /**
     * Hides the panel.
     */
    public hide() {
        this._panel.classList.add(HiddenOverlayClass);
    }

    public toggle() {
        this._panel.classList.toggle(CollapsedOverlayClass);
    }

    public register(overlay: Overlay) {
        overlay.registered = true;
        overlay.onregisteredchange?.(true);

        if (this._tabsRegistry.filter((t) => t.overlay === overlay).length > 0)
            return;

        this._tabsRegistry.push({ overlay });
        this.show();
        this._render();
    }

    public unregister(overlay: Overlay) {
        overlay.registered = false;
        overlay.onregisteredchange?.(false);
        overlay.onclose?.();
        const tab = this._tabsRegistry.filter((t) => t.overlay === overlay)[0];
        if (!tab) return;

        const childs = this._tabsRegistry.filter(
            (x) => x.overlay.parent === overlay
        );
        childs.forEach((x) => this.unregister(x.overlay));

        const tabIndex = this._tabsRegistry.indexOf(tab);
        this._tabsRegistry = this._tabsRegistry.filter(
            (t) => t.overlay !== overlay
        );

        if (this.activeOverlay === overlay) {
            this.activeOverlay = null;

            if (this._tabsRegistry.length > 0) {
                // if there are tabs on the right, then open the next one, otherwise open the last
                const areTabsRight = this._tabsRegistry.length > tabIndex;
                const nextTab = areTabsRight
                    ? this._tabsRegistry[tabIndex]
                    : this._tabsRegistry[this._tabsRegistry.length - 1];
                this.activate(nextTab.overlay);
            }
        }

        if (this._tabsRegistry.length == 0) {
            this.hide();
        }

        this._render();
    }

    public unregisterAll(source?: string) {
        const unregisterTabs = source
            ? this._tabsRegistry.filter((x) => x.overlay.source === source)
            : this._tabsRegistry;
        unregisterTabs.forEach(({ overlay }) => this.unregister(overlay));
    }

    public activate(overlay: Overlay) {
        if (overlay.parent) return this.activate(overlay.parent);
        if (this.activeOverlay == overlay) return;

        if (this.activeOverlay) {
            this.deactivate(this.activeOverlay);
        }

        this.activeOverlay = overlay;

        this._render();
    }

    public deactivate(overlay: Overlay) {
        const tab = this._tabsRegistry.filter((t) => t.overlay === overlay)[0];
        if (this.activeOverlay === tab.overlay) this.activeOverlay = null;
        this._render();
    }

    public getOverlays() {
        return this._tabsRegistry.map((x) => x.overlay);
    }

    public openPopup(path: string) {
        const url = browser.runtime.getURL("popup.html") + `#/${path}`;
        const overlays = this.getOverlays();
        const overlay =
            overlays.find((x) => x.uri === url) ??
            this.createOverlay(url, capitalizeFirstLetter(path));
        initBGFunctions(browser).then(x => x.getThisTab()).then(x => overlay.send("changeTab", [path, x]));
        this.activate(overlay);
        this.show();
        this.open();
    }

    public destroy() {
        this.unregisterAll();
        this._panel.remove();
    }

    public createOverlay(
        uri: string,
        title: string,
        source: string = null,
        hidden: boolean = false,
        parent: Overlay = null
    ): Overlay {
        const overlay = new Overlay(this, uri, title, source, hidden, parent);
        return overlay;
    }

    private _render() {
        ReactDOM.render(
            <App
                overlayManager={this}
                onToggle={this.toggle.bind(this)}
                ref={this.ref}
            />,
            this._shadow
        );
    }
}