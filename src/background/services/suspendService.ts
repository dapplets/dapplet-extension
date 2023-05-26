import browser from 'webextension-polyfill'
import * as Helpers from '../../common/helpers'
import GlobalConfigService from './globalConfigService'

export class SuspendService {
  private lastExtensionIcon = null
  private isContextMenusUpdating = false

  constructor(private _globalConfigService: GlobalConfigService) {}

  changeIcon = async () => {
    const tab = await Helpers.getCurrentTab()
    if (!tab) return
    const url = tab.url || tab['pendingUrl'] // ToDo: check existance of pendingUrl
    const hostname = Helpers.getHostName(url)
    const suspendityByHostname = await this.getSuspendityByHostname(hostname)
    const suspendityEverywhere = await this.getSuspendityEverywhere()

    const isSuspeded = suspendityByHostname || suspendityEverywhere
    const path = isSuspeded ? '/icons/icon-grayed16.png' : '/icons/icon16.png'

    if (this.lastExtensionIcon != path) {
      this.lastExtensionIcon = path
      browser.action.setIcon({ path: path })
    }
  }

  // TODO Errors are thrown sometimes because context menu duplication
  updateContextMenus = async () => {
    if (this.isContextMenusUpdating) return

    this.isContextMenusUpdating = true
    browser.contextMenus.removeAll()
    const tab = await Helpers.getCurrentTab()
    if (!tab) return
    const url = tab.url || tab['pendingUrl'] // ToDo: check existance of pendingUrl
    const hostname = Helpers.getHostName(url)

    const suspendityByHostname = await this.getSuspendityByHostname(hostname)

    if (suspendityByHostname) {
      browser.contextMenus.create({
        id: 'res_this',
        title: 'Resume on this site',
        contexts: ['action'],
      })
      const contextClick = async (info) => {
        const { menuItemId } = info
        if (menuItemId === 'res_this') {
          await this.resumeByHostname(hostname)
          await this.updateContextMenus()
        }
      }
      browser.contextMenus.onClicked.addListener(contextClick)
    } else {
      browser.contextMenus.create({
        id: 'sus_this',
        title: 'Suspend on this site',
        contexts: ['action'],
      })
      const contextClick = async (info) => {
        const { menuItemId } = info
        if (menuItemId === 'sus_this') {
          await this.suspendByHostname(hostname)
          await this.updateContextMenus()
        }
      }
      browser.contextMenus.onClicked.addListener(contextClick)
    }

    const suspendityEverywhere = await this.getSuspendityEverywhere()

    if (suspendityEverywhere) {
      browser.contextMenus.create({
        id: 'res_all',
        title: 'Resume on all sites',
        contexts: ['action'],
      })
      const contextClick = async (info) => {
        const { menuItemId } = info
        if (menuItemId === 'res_all') {
          await this.resumeEverywhere()
          await this.updateContextMenus()
        }
      }
      browser.contextMenus.onClicked.addListener(contextClick)
    } else {
      browser.contextMenus.create({
        id: 'sus_all',
        title: 'Suspend on all sites',
        contexts: ['action'],
      })
      const contextClick = async (info) => {
        const { menuItemId } = info
        if (menuItemId === 'sus_all') {
          await this.suspendEverywhere()
          await this.updateContextMenus()
        }
      }
      browser.contextMenus.onClicked.addListener(contextClick)
    }

    this.isContextMenusUpdating = false
  }

  /**
   * Suspend working of injectors by passed hostname
   * @async
   * @param {string} hostname
   * @returns {Promise<void>}
   */
  suspendByHostname = async (hostname) => {
    const config = await this._globalConfigService.getSiteConfigById(hostname)
    config.paused = true
    await this._globalConfigService.updateSiteConfig(config)

    await this.changeIcon()
    await this.updateContextMenus()
    console.log('[DAPPLETS]: Injecting is suspended at the ' + hostname)
  }

  /**
   * Resume working of injectors by passed hostname
   * @async
   * @param {string} hostname
   * @returns {Promise<void>}
   */
  resumeByHostname = async (hostname) => {
    const config = await this._globalConfigService.getSiteConfigById(hostname)
    config.paused = false
    await this._globalConfigService.updateSiteConfig(config)

    await this.changeIcon()
    await this.updateContextMenus()
    console.log('[DAPPLETS]: Injecting is resumed at the ' + hostname)
  }

  /**
   * Resume suspendity (is blocked?) of passed hostname
   * @async
   * @param {string} hostname
   * @returns {Promise<boolean>}
   */
  getSuspendityByHostname = async (hostname) => {
    const config = await this._globalConfigService.getSiteConfigById(hostname)
    return !config ? false : config.paused
  }

  /**
   * Suspend working of injectors globally
   * @async
   * @returns {Promise<void>}
   */
  suspendEverywhere = async () => {
    const config = await this._globalConfigService.get()
    config.suspended = true
    await this._globalConfigService.set(config)

    await this.changeIcon()
    await this.updateContextMenus()
    console.log('[DAPPLETS]: Injecting is suspended everywhere')
  }

  /**
   * Resume working of injectors globally
   * @async
   * @returns {Promise<void>}
   */
  resumeEverywhere = async () => {
    const config = await this._globalConfigService.get()
    config.suspended = false
    await this._globalConfigService.set(config)

    await this.changeIcon()
    await this.updateContextMenus()
    console.log('[DAPPLETS]: Injecting is resumed everywhere')
  }

  /**
   * Resume suspendity (is blocked?) of injectors globally
   * @async
   * @returns {Promise<boolean>}
   */
  getSuspendityEverywhere = async () => {
    const { suspended } = await this._globalConfigService.get()
    return suspended
  }
}
