import INNER_STYLE from '!raw-loader!./overlayManager.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { JsonRpc } from '../../../common/jsonrpc'
import { IOverlayManager, OverlayConfig } from '../interfaces'
import { App } from './App'
import { Overlay } from './overlay'

const CollapsedOverlayClass = 'dapplets-overlay-collapsed'
const HiddenOverlayClass = 'dapplets-overlay-hidden'
const DappletsOverlayManagerClass = 'dapplets-overlay-manager'
const OverlayFrameClass = 'dapplets-overlay-frame'

export class OverlayManager implements IOverlayManager {
  private _panel: HTMLElement = null
  public activeOverlay: Overlay = null
  public onActiveOverlayChanged: (newOverlay: Overlay | null) => void | null = null

  private _root = null

  private _tabsRegistry: {
    overlay: Overlay
  }[] = []

  constructor(private _iframeMessenger: JsonRpc) {
    // Side panel
    const extensionHostID = 'dapplets-overlay-manager'
    const extensionHost = document.getElementById(extensionHostID)

    if (!extensionHost) {
      const panel = document.createElement(DappletsOverlayManagerClass)
      panel.id = 'dapplets-overlay-manager'
      panel.classList.add(OverlayFrameClass, CollapsedOverlayClass, HiddenOverlayClass)
      // panel.classList.remove()
      this._panel = panel

      const shadowRoot = panel.attachShadow({ mode: 'open' })

      const container = document.createElement('div')
      container.id = 'app'

      shadowRoot.appendChild(container)

      this._root = container
    } else {
      this._panel = extensionHost
      this._root = extensionHost.shadowRoot.getElementById('app')
    }

    const styles = document.createElement('style')
    styles.innerHTML = INNER_STYLE
    document.head.appendChild(styles)

    this._render()

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

    document.body.appendChild(this._panel)
  }

  /**
   * Expands the panel.
   */
  public open() {
    this._panel.classList.remove(CollapsedOverlayClass)
    this._render()
  }

  /**
   * Collapses the panel.
   */
  public close() {
    this._panel.classList.add(CollapsedOverlayClass)
    this._render()
  }

  /**
   * Shows the panel.
   */
  public show() {
    this._panel.classList.remove(HiddenOverlayClass)
    this._render()
  }

  public togglePanel() {
    this._panel.classList.toggle(HiddenOverlayClass)
    // this._panel.classList.toggle(CollapsedOverlayClass)
    this._render()
  }

  /**
   * Hides the panel.
   */
  public hide() {
    this._panel.classList.add(HiddenOverlayClass)
    this._render()
  }

  public toggle() {
    this._panel.classList.toggle(CollapsedOverlayClass)
    this._render()
  }

  public register(overlay: Overlay) {
    overlay.registered = true
    overlay.onregisteredchange?.(true)

    if (this._tabsRegistry.filter((t) => t.overlay === overlay).length > 0) return

    this._tabsRegistry.push({ overlay })
    this.show()
    this._render()
  }

  public unregister(overlay: Overlay) {
    const oldOverlay = this.activeOverlay

    overlay.registered = false
    overlay.onregisteredchange?.(false)
    overlay.onclose?.()
    const tab = this._tabsRegistry.filter((t) => t.overlay === overlay)[0]
    if (!tab) return

    const childs = this._tabsRegistry.filter((x) => x.overlay.parent === overlay)
    childs.forEach((x) => this.unregister(x.overlay))

    const tabIndex = this._tabsRegistry.indexOf(tab)
    this._tabsRegistry = this._tabsRegistry.filter((t) => t.overlay !== overlay)

    if (this.activeOverlay === overlay) {
      this.activeOverlay = null

      if (this._tabsRegistry.length > 0) {
        // if there are tabs on the right, then open the next one, otherwise open the last
        const areTabsRight = this._tabsRegistry.length > tabIndex
        const nextTab = areTabsRight
          ? this._tabsRegistry[tabIndex]
          : this._tabsRegistry[this._tabsRegistry.length - 1]
        this.activate(nextTab.overlay)
      }
    }

    // if (this._tabsRegistry.length == 0) {
    //   this.hide()
    // }

    if (this.activeOverlay !== oldOverlay) {
      this.onActiveOverlayChanged?.(this.activeOverlay)
    }

    this._render()
  }

  public unregisterAll(source?: string) {
    const unregisterTabs = source
      ? this._tabsRegistry.filter((x) => x.overlay.source === source)
      : this._tabsRegistry
    unregisterTabs.forEach(({ overlay }) => this.unregister(overlay))
  }

  public activate(overlay: Overlay) {
    const oldOverlay = this.activeOverlay

    if (overlay.parent) return this.activate(overlay.parent as Overlay)
    if (this.activeOverlay == overlay) return

    if (this.activeOverlay) {
      this.deactivate(this.activeOverlay)
    }

    this.activeOverlay = overlay

    if (this.activeOverlay !== oldOverlay) {
      this.onActiveOverlayChanged?.(this.activeOverlay)
    }

    this._render()
  }

  public deactivate(overlay: Overlay) {
    const oldOverlay = this.activeOverlay
    const tab = this._tabsRegistry.filter((t) => t.overlay === overlay)[0]
    if (this.activeOverlay === tab.overlay) {
      this.activeOverlay = null

      if (null !== oldOverlay) {
        this.onActiveOverlayChanged?.(null)
      }
    }
    this._render()
  }

  public getOverlays() {
    return this._tabsRegistry.map((x) => x.overlay)
  }

  public openPopup() {
    this.togglePanel()
  }

  public destroy() {
    this.unregisterAll()
    this._panel.remove()
  }

  public createOverlay(config: OverlayConfig): Overlay {
    const overlay = new Overlay(this, config)
    return overlay
  }

  private _render() {
    ReactDOM.render(
      <App
        hidden={this._panel.classList.contains(HiddenOverlayClass)}
        overlayManager={this}
        onToggle={this.toggle.bind(this)}
      />,
      this._root
    )
  }
}
