import { browser } from 'webextension-polyfill-ts';
import { capitalizeFirstLetter } from '../common/helpers';
import { Overlay } from './overlay';

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
const OverlayOuterClass = 'dapplets-overlay-outer';
const OverlayFrameClass = 'dapplets-overlay-frame';
const OverlayBucketBarClass = 'dapplets-overlay-bucket-bar';
const OverlayToolbarClass = 'dapplets-overlay-toolbar';
const OverlayFrameButtonClass = 'dapplets-overlay-frame-button';
const OverlayFrameButtonSidebarToggleClass = 'dapplets-overlay-frame-button-sidebar-toggle';

export class OverlayManager {
    private _panel: HTMLElement = null;
    private _tabList: HTMLDivElement = null;
    private _contentList: HTMLDivElement = null;
    private _activeOverlay: Overlay = null;
    private _popupOverlay: Overlay = null;
    private _identityOverlay: Overlay = null;

    private _tabsRegistry: {
        overlay: Overlay,
        tabItem?: HTMLDivElement,
        contentItem: HTMLDivElement
    }[] = [];

    constructor() {
        // Side panel
        const panel = document.createElement(DappletsOverlayManagerClass);
        panel.classList.add(OverlayFrameClass, OverlayOuterClass, CollapsedOverlayClass, HiddenOverlayClass);
        document.body.appendChild(panel);
        this._panel = panel;

        const bucketBar = document.createElement("div");
        bucketBar.classList.add(OverlayBucketBarClass);
        panel.appendChild(bucketBar);

        const toolBar = document.createElement("div");
        toolBar.classList.add(OverlayToolbarClass);
        panel.appendChild(toolBar);

        const ul = document.createElement('ul');
        toolBar.appendChild(ul);

        const li = document.createElement('li');
        ul.appendChild(li);

        const button = document.createElement('button');
        button.title = "Toggle Overlay";
        button.classList.add(OverlayFrameButtonClass, OverlayFrameButtonSidebarToggleClass);
        button.innerText = '⇄';
        button.onclick = () => this.toggle();
        li.appendChild(button);

        // Tabs
        const nav = document.createElement("div");
        nav.classList.add(PageNavClass);
        panel.appendChild(nav);

        const topPanel = document.createElement("div");
        topPanel.classList.add(TopPanelClass);
        nav.appendChild(topPanel);

        const tabList = document.createElement("div");
        tabList.classList.add(TabListClass);
        topPanel.appendChild(tabList);
        this._tabList = tabList;

        const topActions = document.createElement("div");
        topActions.classList.add(TopActionsClass);
        topPanel.appendChild(topActions);

        const avatarAction = document.createElement("div");
        avatarAction.innerHTML = `
            <button>
                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-circle" class="svg-inline--fa fa-user-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path></svg>    
            </button>
            <div>
                <a href="#">Account Groups</a>
                <a href="#">Logout</a>
            </div>
        `;
        avatarAction.classList.add('dapplets-action-dropdown');
        avatarAction.addEventListener('click', (e) => {
            if ((e.target as any).innerText === 'Account Groups') {
                const url = browser.extension.getURL('identity.html');
                this._identityOverlay = this._identityOverlay ?? new Overlay(this, url, 'Identity');
                this._identityOverlay.open();
            }
        });
        topActions.appendChild(avatarAction);

        const menuAction = document.createElement("div");
        menuAction.innerHTML = `
            <button>
                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bars" class="svg-inline--fa fa-bars fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path></svg>
            </button>
            <div>
                <a href="#">Dapplets</a>
                <a href="#">Wallets</a>
                <a href="#">Settings</a>
                <a href="#">Developer</a>
            </div>
        `;
        menuAction.classList.add('dapplets-action-dropdown');
        menuAction.addEventListener('click', (e) => {
            const text = (e.target as any).innerText;
            if (!text) return;

            const path = text.toLowerCase();
            this.openPopup(path);
        });
        topActions.appendChild(menuAction);

        const contentList = document.createElement("div");
        contentList.classList.add(ContentListClass);
        nav.appendChild(contentList);
        this._contentList = contentList;

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
        if (this._tabsRegistry.filter(t => t.overlay === overlay).length > 0) return;

        const contentItem = document.createElement('div');
        contentItem.classList.add(ContentItemClass);
        contentItem.appendChild(overlay.frame);
        this._contentList.appendChild(contentItem);

        if (!overlay.hidden) {
            const tabItem = document.createElement('div');
            tabItem.classList.add(TabItemClass);

            const titleDiv = document.createElement('div');
            titleDiv.innerText = overlay.title;
            titleDiv.title = overlay.title;
            titleDiv.classList.add('dapplets-overlay-nav-tab-item-title');

            tabItem.appendChild(titleDiv);
            tabItem.addEventListener('click', (ev) => {
                ev.cancelBubble = true;
                ev.stopPropagation();
                this.activate(overlay);
            });
            this._tabList.appendChild(tabItem);

            const closeBtn = document.createElement('div');
            closeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 16 16" style="width: 10px;">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;
            closeBtn.classList.add(CloseButtonClass);
            closeBtn.addEventListener('click', (ev) => {
                ev.cancelBubble = true;
                ev.stopPropagation();
                //this.unregister(overlay);
                overlay.close();
            });
            tabItem.appendChild(closeBtn);

            this._tabsRegistry.push({ overlay, tabItem, contentItem });
        } else {
            this._tabsRegistry.push({ overlay, contentItem });
        }

        this.activate(overlay);

        this.show();
    }

    public unregister(overlay: Overlay) {
        overlay.registered = false;
        overlay.onclose?.();
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (!tab) return;

        if (tab.tabItem) this._tabList.removeChild(tab.tabItem);
        this._contentList.removeChild(tab.contentItem);

        this._tabsRegistry = this._tabsRegistry.filter(t => t.overlay !== overlay);

        if (this._activeOverlay === overlay) {
            this._activeOverlay = null;
            const nextTab = this._tabsRegistry[0];
            nextTab && this.activate(nextTab.overlay);
        }

        if (this._tabsRegistry.length == 0) {
            this.hide();
        }
    }

    public unregisterAll() {
        this._tabsRegistry.forEach(({ overlay }) => this.unregister(overlay));
    }

    public activate(overlay: Overlay) {
        if (this._activeOverlay == overlay) return;

        if (this._activeOverlay) {
            this.deactivate(this._activeOverlay);
        }

        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (tab.tabItem) tab.tabItem.classList.toggle(ActiveTabHeaderClass, true);
        tab.contentItem.classList.toggle(ActiveTabContentClass, true);

        this._activeOverlay = overlay;
    }

    public deactivate(overlay: Overlay) {
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (tab.tabItem) tab.tabItem.classList.toggle(ActiveTabHeaderClass, false);
        tab.contentItem.classList.toggle(ActiveTabContentClass, false);
    }

    public getOverlays() {
        return this._tabsRegistry.map(x => x.overlay);
    }

    public openPopup(path: string) {
        const url = browser.extension.getURL('popup.html') + `#/${path}`;
        const overlays = this.getOverlays();
        const overlay = overlays.find(x => x.uri === url) ?? new Overlay(this, url, capitalizeFirstLetter(path));
        overlay.send('changeTab', [path]);
        this.activate(overlay);
        this.show();
        this.open();
    }
}