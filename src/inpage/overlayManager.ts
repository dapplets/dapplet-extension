import { Overlay } from './overlay';

// ToDo: clean class names
const TabItemClass = 'pageNav__tabItem';
const ContentItemClass = 'pageNav__contentItem';
const ActiveTabHeaderClass = 'pageNav__tabItem--active';
const ActiveTabContentClass = 'pageNav__contentItem--active';
const CollapsedOverlayClass = 'overlay-collapsed';
const HiddenOverlayClass = 'overlay-hidden';


export class OverlayManager {
    private _panel: HTMLElement = null;
    private _tabList: HTMLDivElement = null;
    private _contentList: HTMLDivElement = null;
    private _activeOverlay: Overlay = null;

    private _tabsRegistry: {
        overlay: Overlay,
        tabItem: HTMLDivElement,
        contentItem: HTMLDivElement
    }[] = [];

    constructor() {
        // Side panel
        const panel = document.createElement("dapplets-overlay-manager");
        panel.classList.add('overlay-frame', 'overlay-outer', CollapsedOverlayClass, HiddenOverlayClass);
        document.body.appendChild(panel);
        this._panel = panel;

        const bucketBar = document.createElement("div");
        bucketBar.classList.add('overlay-bucket-bar');
        panel.appendChild(bucketBar);

        const toolBar = document.createElement("div");
        toolBar.classList.add('overlay-toolbar');
        panel.appendChild(toolBar);

        const ul = document.createElement('ul');
        toolBar.appendChild(ul);

        const li = document.createElement('li');
        ul.appendChild(li);

        const button = document.createElement('button');
        button.title = "Toggle or Resize Sidebar";
        button.classList.add('overlay-frame-button', 'overlay-frame-button--sidebar_toggle');
        button.innerText = '⇄';
        button.onclick = () => this.toggle();
        li.appendChild(button);

        // Tabs
        const nav = document.createElement("div");
        nav.classList.add('pageNav');
        panel.appendChild(nav);

        const tabList = document.createElement("div");
        tabList.classList.add('pageNav__tabList');
        nav.appendChild(tabList);
        this._tabList = tabList;

        const contentList = document.createElement("div");
        contentList.classList.add('pageNav__contentList');
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

        const tabItem = document.createElement('div');
        tabItem.classList.add(TabItemClass);
        tabItem.innerText = overlay.title;
        tabItem.addEventListener('click', (ev) => {
            ev.cancelBubble = true;
            ev.stopPropagation();
            this.activate(overlay);
        });
        this._tabList.appendChild(tabItem);

        const closeBtn = document.createElement('span');
        closeBtn.innerText = 'X';
        closeBtn.classList.add('tabItem__closeBtn');
        closeBtn.addEventListener('click', (ev) => {
            ev.cancelBubble = true;
            ev.stopPropagation();
            //this.unregister(overlay);
            overlay.close();
        });
        tabItem.appendChild(closeBtn);

        const contentItem = document.createElement('div');
        contentItem.classList.add(ContentItemClass);
        contentItem.appendChild(overlay.frame);
        this._contentList.appendChild(contentItem);

        this._tabsRegistry.push({ overlay, tabItem, contentItem });

        this.activate(overlay);

        this.show();
    }

    public unregister(overlay: Overlay) {
        console.log('unregister overlay ' + overlay.title);
        overlay.registered = false;
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        if (!tab) return;

        this._tabList.removeChild(tab.tabItem);
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
        //console.log('activate overlay ' + overlay.title);
        if (this._activeOverlay == overlay) return;

        if (this._activeOverlay) {
            this.deactivate(this._activeOverlay);
        }

        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        tab.tabItem.classList.toggle(ActiveTabHeaderClass, true);
        tab.contentItem.classList.toggle(ActiveTabContentClass, true);

        this._activeOverlay = overlay;
    }

    public deactivate(overlay: Overlay) {
        //console.log('deactivate overlay ' + overlay.title);
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        tab.tabItem.classList.toggle(ActiveTabHeaderClass, false);
        tab.contentItem.classList.toggle(ActiveTabContentClass, false);
    }
}