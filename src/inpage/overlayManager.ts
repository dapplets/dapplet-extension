import { Overlay } from './overlay';

// ToDo: clean class names
const TabItemClass = 'pageNav__tabItem';
const ContentItemClass = 'pageNav__contentItem';
const ActiveTabHeaderClass = 'pageNav__tabItem--active';
const ActiveTabContentClass = 'pageNav__contentItem--active';

export class OverlayManager {
    public isOpened: boolean = false;
    private _panel: HTMLDivElement = null;
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
        const panel = document.createElement("div");
        panel.classList.add('overlay-frame', 'overlay-outer', 'overlay-collapsed', 'overlay-hidden');
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

    public open() {
        this._panel.classList.remove('overlay-collapsed');
        this.isOpened = true;
    }

    public close() {
        this._panel.classList.add('overlay-collapsed');
        this.isOpened = false;
    }

    public show() {
        this._panel.classList.remove('overlay-hidden');
    }

    public hide() {
        this._panel.classList.add('overlay-hidden');
    }

    public toggle() {
        if (this.isOpened) {
            this.close();
        } else {
            this.open();
        }
    }

    public register(overlay: Overlay) {
        if (this._tabsRegistry.filter(t => t.overlay === overlay).length > 0) return;
        
        console.log('register overlay ' + overlay.title);
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
            this.unregister(overlay);
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

    public activate(overlay: Overlay) {
        console.log('activate overlay ' + overlay.title);
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
        console.log('deactivate overlay ' + overlay.title);
        const tab = this._tabsRegistry.filter(t => t.overlay === overlay)[0];
        tab.tabItem.classList.toggle(ActiveTabHeaderClass, false);
        tab.contentItem.classList.toggle(ActiveTabContentClass, false);
    }
}