import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { browser } from 'webextension-polyfill-ts';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { capitalizeFirstLetter } from '../../../common/helpers';
import { Overlay } from './overlay';
import INNER_STYLE from '!raw-loader!./overlay.css';
import { IOverlayManager } from '../interfaces';
import { JsonRpc } from '../../../common/jsonrpc';
import { App } from './App';

const PageNavClass = 'dapplets-overlay-nav';
const TopPanelClass = 'dapplets-overlay-nav-top-panel';
const TabListClass = 'dapplets-overlay-nav-tab-list';
const TopActionsClass = 'dapplets-overlay-nav-top-actions';
const ContentListClass = 'dapplets-overlay-nav-content-list';
const TabItemClass = 'dapplets-overlay-nav-tab-item';
const ContentItemClass = 'dapplets-overlay-nav-content-item';
const ActiveTabHeaderClass = 'dapplets-overlay-nav-tab-item-active';
const ActiveTabContentClass = 'dapplets-overlay-nav-content-item-active';
const CloseButtonClass = 'dapplets-overlay-nav-tab-item-close-btn';
const CollapsedOverlayClass = 'dapplets-overlay-collapsed';
const HiddenOverlayClass = 'dapplets-overlay-hidden';
const DappletsOverlayManagerClass = 'dapplets-overlay-manager';
const OverlayFrameClass = 'dapplets-overlay-frame';
const OverlayBucketBarClass = 'dapplets-overlay-bucket-bar';
const OverlayToolbarClass = 'dapplets-overlay-toolbar';
const OverlayFrameButtonClass = 'dapplets-overlay-frame-button';
const OverlayFrameButtonSidebarToggleClass = 'dapplets-overlay-frame-button-sidebar-toggle';
const PopupContainerClass = 'dapplets-popup-container';


export class OverlayManager implements IOverlayManager {
    private _panel: HTMLElement = null;
    private _tabList: HTMLDivElement = null;
    private _contentList: HTMLDivElement = null;
    private _activeOverlay: Overlay = null;

    private _shadow = null;

    private _tabsRegistry: {
        overlay: Overlay,
        tabItem?: HTMLDivElement,
        contentItem?: HTMLDivElement
    }[] = [];

    constructor(private _iframeMessenger: JsonRpc) {
        // Side panel
        const panel = document.createElement(DappletsOverlayManagerClass);
        panel.classList.add(OverlayFrameClass, CollapsedOverlayClass, HiddenOverlayClass);
        this._panel = panel;

        this._shadow = panel.attachShadow({ mode: 'open' });

        this._render();

        // const style = document.createElement('style');
        // style.textContent = INNER_STYLE;
        // shadow.appendChild(style);

        // const bucketBar = document.createElement("div");
        // bucketBar.classList.add(OverlayBucketBarClass);
        // shadow.appendChild(bucketBar);

        // const toolBar = document.createElement("div");
        // toolBar.classList.add(OverlayToolbarClass);
        // shadow.appendChild(toolBar);

        // const ul = document.createElement('ul');
        // toolBar.appendChild(ul);

        // const li = document.createElement('li');
        // ul.appendChild(li);

        // const button = document.createElement('button');
        // button.title = "Toggle Overlay";
        // button.classList.add(OverlayFrameButtonClass, OverlayFrameButtonSidebarToggleClass);
        // button.innerText = '⇄';
        // button.onclick = () => this.toggle();
        // li.appendChild(button);

        // // Tabs
        // const nav = document.createElement("div");
        // nav.classList.add(PageNavClass);
        // shadow.appendChild(nav);

        // const topPanel = document.createElement("div");
        // topPanel.classList.add(TopPanelClass);
        // nav.appendChild(topPanel);

        // const tabList = document.createElement("div");
        // tabList.classList.add(TabListClass);
        // topPanel.appendChild(tabList);
        // this._tabList = tabList;

        // const topActions = document.createElement("div");
        // topActions.classList.add(TopActionsClass);
        // topPanel.appendChild(topActions);

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

        // const menuAction = document.createElement("div");

        // const menuButton = document.createElement("button");
        // menuButton.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bars" class="svg-inline--fa fa-bars fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path></svg>`;

        // const menuDropdown = document.createElement("div");

        // const menuDappletsItem = document.createElement("div");
        // menuDappletsItem.innerText = "Dapplets";
        // menuDappletsItem.addEventListener('click', () => this.openPopup('dapplets'));
        // menuDropdown.appendChild(menuDappletsItem);

        // const menuWalletsItem = document.createElement("div");
        // menuWalletsItem.innerText = "Wallets";
        // menuWalletsItem.addEventListener('click', () => this.openPopup('wallets'));
        // menuDropdown.appendChild(menuWalletsItem);

        // const menuSettingsItem = document.createElement("div");
        // menuSettingsItem.innerText = "Settings";
        // menuSettingsItem.addEventListener('click', () => this.openPopup('settings'));
        // menuDropdown.appendChild(menuSettingsItem);

        // menuAction.appendChild(menuButton);
        // menuAction.appendChild(menuDropdown);

        // menuAction.classList.add('dapplets-action-dropdown');
        // topActions.appendChild(menuAction);

        // initBGFunctions(browser)
        //     .then(({ getDevMode }) => getDevMode())
        //     .then(devMode => {
        //         if (!devMode) return;
        //         const menuDeveloperItem = document.createElement("div");
        //         menuDeveloperItem.innerText = "Developer";
        //         menuDeveloperItem.addEventListener('click', () => this.openPopup('developer'));
        //         menuDropdown.appendChild(menuDeveloperItem);
        //     });

        // const contentList = document.createElement("div");
        // contentList.classList.add(ContentListClass);
        // nav.appendChild(contentList);
        // this._contentList = contentList;


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
        if (this._tabsRegistry.filter(t => t.overlay === overlay).length > 0) return;

        // if (overlay.parent) {
        //     const contentItem = document.createElement('div');
        //     contentItem.classList.add(PopupContainerClass);
            
        //     // adding loading spinner
        //     contentItem.appendChild(overlay.loader);

        //     // adding frame
        //     contentItem.appendChild(overlay.frame);
        //     overlay.parent.frame.parentElement.appendChild(contentItem);
        //     this._tabsRegistry.push({ overlay, contentItem });
        // } else {
        //     const contentItem = document.createElement('div');
        //     contentItem.classList.add(ContentItemClass);
    
        //     // adding loading spinner
        //     contentItem.appendChild(overlay.loader);
    
        //     // adding frame
        //     contentItem.appendChild(overlay.frame);
        //     this._contentList.appendChild(contentItem);

        //     if (!overlay.hidden && !overlay.parent) {
        //         const tabItem = document.createElement('div');
        //         tabItem.classList.add(TabItemClass);
    
        //         const titleDiv = document.createElement('div');
        //         titleDiv.innerText = overlay.title;
        //         titleDiv.title = overlay.title;
        //         titleDiv.classList.add('dapplets-overlay-nav-tab-item-title');
    
        //         tabItem.appendChild(titleDiv);
        //         tabItem.addEventListener('click', (ev) => {
        //             ev.cancelBubble = true;
        //             ev.stopPropagation();
        //             this.activate(overlay);
        //         });
        //         this._tabList.appendChild(tabItem);
    
        //         const closeBtn = document.createElement('div');
        //         closeBtn.innerHTML = `
        //             <svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 16 16" style="width: 10px;">
        //                 <path d="M0 0h24v24H0z" fill="none"/>
        //                 <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        //             </svg>
        //         `;
        //         closeBtn.classList.add(CloseButtonClass);
        //         closeBtn.addEventListener('click', (ev) => {
        //             ev.cancelBubble = true;
        //             ev.stopPropagation();
        //             //this.unregister(overlay);
        //             overlay.close();
        //         });
        //         tabItem.appendChild(closeBtn);
    
        //         this._tabsRegistry.push({ overlay, tabItem, contentItem });
        //     } else {
        //         this._tabsRegistry.push({ overlay, contentItem });
        //     }
        // }

        this._tabsRegistry.push({ overlay });

        this.show();

        this._render();
    }

    public unregister(overlay: Overlay) {
        overlay.registered = false;
        overlay.onregisteredchange?.(false);
        overlay.onclose?.();
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (!tab) return;

        const childs = this._tabsRegistry.filter(x => x.overlay.parent === overlay);
        childs.forEach(x => this.unregister(x.overlay));

        tab.tabItem?.remove();
        tab.contentItem?.remove();

        const tabIndex = this._tabsRegistry.indexOf(tab);
        this._tabsRegistry = this._tabsRegistry.filter(t => t.overlay !== overlay);

        if (this._activeOverlay === overlay) {
            this._activeOverlay = null;

            if (this._tabsRegistry.length > 0) {
                // if there are tabs on the right, then open the next one, otherwise open the last
                const areTabsRight = this._tabsRegistry.length > tabIndex;
                const nextTab = (areTabsRight) ? this._tabsRegistry[tabIndex] : this._tabsRegistry[this._tabsRegistry.length - 1];
                this.activate(nextTab.overlay);
            }
        }

        if (this._tabsRegistry.length == 0) {
            this.hide();
        }

        this._render();
    }

    public unregisterAll(source?: string) {
        const unregisterTabs = source ? this._tabsRegistry.filter(x => x.overlay.source === source) : this._tabsRegistry;
        unregisterTabs.forEach(({ overlay }) => this.unregister(overlay));
    }

    public activate(overlay: Overlay) {
        if (overlay.parent) return this.activate(overlay.parent);
        if (this._activeOverlay == overlay) return;

        if (this._activeOverlay) {
            this.deactivate(this._activeOverlay);
        }

        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (tab.tabItem) tab.tabItem.classList.toggle(ActiveTabHeaderClass, true);
        tab.contentItem.classList.toggle(ActiveTabContentClass, true);

        this._activeOverlay = overlay;

        this._render();
    }

    public deactivate(overlay: Overlay) {
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (tab.tabItem) tab.tabItem.classList.toggle(ActiveTabHeaderClass, false);
        tab.contentItem.classList.toggle(ActiveTabContentClass, false);

        this._render();
    }

    public getOverlays() {
        return this._tabsRegistry.map(x => x.overlay);
    }

    public openPopup(path: string) {
        const url = browser.runtime.getURL('popup.html') + `#/${path}`;
        const overlays = this.getOverlays();
        const overlay = overlays.find(x => x.uri === url) ?? this.createOverlay(url, capitalizeFirstLetter(path));
        overlay.send('changeTab', [path]);
        this.activate(overlay);
        this.show();
        this.open();
    }

    public destroy() {
        this.unregisterAll();
        this._panel.remove();
    }

    public createOverlay(uri: string, title: string, source: string = null, hidden: boolean = false, parent: Overlay = null): Overlay {
        const overlay = new Overlay(this, uri, title, source, hidden, parent);
        return overlay;
    }

    private _render() {
        ReactDOM.render(<App 
            overlays={this._tabsRegistry.map(x => x.overlay)} 
            onToggle={this.toggle.bind(this)}
        />, this._shadow);
    }
}