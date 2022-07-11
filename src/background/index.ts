import { setupMessageListener } from 'chrome-extension-message-wrapper'
import { browser, Tabs } from 'webextension-polyfill-ts'
import { WebSocketProxy } from '../common/chrome-extension-websocket-wrapper'
import { CONTEXT_ID_WILDCARD, ModuleTypes } from '../common/constants'
import {
  checkUrlAvailability,
  getCurrentContextIds,
  getCurrentTab,
  getThisTab,
  multipleReplace,
  reloadCurrentPage,
  waitClosingTab,
  waitTab,
} from '../common/helpers'
import * as tracing from '../common/tracing'
import DiscordService from './services/discordService'
import EnsService from './services/ensService'
import * as EventService from './services/eventService'
import FeatureService from './services/featureService'
import GithubService from './services/githubService'
import GlobalConfigService from './services/globalConfigService'
import { IdentityService } from './services/identityService'
import * as NotificationService from './services/notificationService'
import { OverlayService } from './services/overlayService'
import ProxyService from './services/proxyService'
import { SessionService } from './services/sessionService'
import { SuspendService } from './services/suspendService'
import { WalletService } from './services/walletService'

// ToDo: Fix duplication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
tracing.startTracing()

const globalConfigService = new GlobalConfigService()
const suspendService = new SuspendService(globalConfigService)
const overlayService = new OverlayService()
const proxyService = new ProxyService(globalConfigService)
const githubService = new GithubService(globalConfigService)
const discordService = new DiscordService(globalConfigService)
const walletService = new WalletService(globalConfigService, overlayService)
const sessionService = new SessionService(walletService, overlayService)
const featureService = new FeatureService(globalConfigService, walletService, overlayService)
const identityService = new IdentityService(globalConfigService, walletService)
const ensService = new EnsService(walletService)

// ToDo: fix this circular dependency
walletService.sessionService = sessionService

browser.runtime.onMessage.addListener(
  setupMessageListener({
    // WalletService
    prepareWalletFor: walletService.prepareWalletFor.bind(walletService),
    connectWallet: walletService.connectWallet.bind(walletService),
    disconnectWallet: walletService.disconnectWallet.bind(walletService),
    getWalletDescriptors: walletService.getWalletDescriptors.bind(walletService),
    getWalletFor: walletService.getWalletFor.bind(walletService),
    getDefaultWalletFor: walletService.getDefaultWalletFor.bind(walletService),
    setWalletFor: walletService.setWalletFor.bind(walletService),
    unsetWalletFor: walletService.unsetWalletFor.bind(walletService),
    getAddress: walletService.getAddress.bind(walletService),

    eth_sendTransactionOutHash: walletService.eth_sendTransactionOutHash.bind(walletService),
    eth_sendCustomRequest: walletService.eth_sendCustomRequest.bind(walletService),
    eth_waitTransaction: walletService.eth_waitTransaction.bind(walletService),
    near_sendCustomRequest: walletService.near_sendCustomRequest.bind(walletService),

    // SessionService
    createSession: sessionService.createSession.bind(sessionService),
    createLoginConfirmation: sessionService.createLoginConfirmation.bind(sessionService),
    killSession: sessionService.killSession.bind(sessionService),
    getSessions: sessionService.getSessions.bind(sessionService),
    getSuitableLoginConfirmations:
      sessionService.getSuitableLoginConfirmations.bind(sessionService),
    isValidSession: sessionService.isValidSession.bind(sessionService),
    getSessionItem: sessionService.getItem.bind(sessionService),
    setSessionItem: sessionService.setItem.bind(sessionService),
    removeSessionItem: sessionService.removeItem.bind(sessionService),
    clearSessionItems: sessionService.clearItems.bind(sessionService),

    // Upgrade Guide
    openGuideOverlay: overlayService.openGuideOverlay.bind(overlayService),

    // SuspendService
    getSuspendityByHostname: suspendService.getSuspendityByHostname.bind(suspendService),
    getSuspendityEverywhere: suspendService.getSuspendityEverywhere.bind(suspendService),
    suspendByHostname: suspendService.suspendByHostname.bind(suspendService),
    suspendEverywhere: suspendService.suspendEverywhere.bind(suspendService),
    resumeByHostname: suspendService.resumeByHostname.bind(suspendService),
    resumeEverywhere: suspendService.resumeEverywhere.bind(suspendService),

    // NotificationService
    transactionCreated: NotificationService.transactionCreated,
    transactionRejected: NotificationService.transactionRejected,

    // FeatureService
    getFeaturesByHostnames: (hostnames) => featureService.getFeaturesByHostnames(hostnames),
    activateFeature: (name, version, hostnames, order, registry) =>
      featureService.activateFeature(name, version, hostnames, order, registry),
    deactivateFeature: (name, version, hostnames, order, registry) =>
      featureService.deactivateFeature(name, version, hostnames, order, registry),
    reloadFeature: (name, version, hostnames, order, registry) =>
      featureService.reloadFeature(name, version, hostnames, order, registry),
    getActiveModulesByHostnames: (hostnames) =>
      featureService.getActiveModulesByHostnames(hostnames),
    getModulesWithDeps: (modules) => featureService.getModulesWithDeps(modules),
    optimizeDependency: (name, branch, version, contextIds) =>
      featureService.optimizeDependency(name, branch, version, contextIds),
    getAllDevModules: () => featureService.getAllDevModules(),
    uploadModule: (mi, vi, targetStorages) => featureService.uploadModule(mi, vi, targetStorages),
    deployModule: (mi, vi, targetStorages, targetRegistry) =>
      featureService.deployModule(mi, vi, targetStorages, targetRegistry),
    getRegistries: () => featureService.getRegistries(),
    getOwnership: (registryUri, moduleName) => featureService.getOwnership(registryUri, moduleName),
    getVersionInfo: (registryUri, moduleName, branch, version) =>
      featureService.getVersionInfo(registryUri, moduleName, branch, version),
    getModuleInfoByName: (registryUri, moduleName) =>
      featureService.getModuleInfoByName(registryUri, moduleName),
    transferOwnership: (registryUri, moduleName, oldAccount, newAccount) =>
      featureService.transferOwnership(registryUri, moduleName, oldAccount, newAccount),
    addContextId: (registryUri, moduleName, contextId) =>
      featureService.addContextId(registryUri, moduleName, contextId),
    removeContextId: (registryUri, moduleName, contextId) =>
      featureService.removeContextId(registryUri, moduleName, contextId),
    editModuleInfo: (registryUri, targetStorages, module) =>
      featureService.editModuleInfo(registryUri, targetStorages, module),
    getVersions: (registryUri, moduleName) => featureService.getVersions(registryUri, moduleName),
    openSettingsOverlay: (mi) => featureService.openSettingsOverlay(mi),
    removeDapplet: (name, hostnames) => featureService.removeDapplet(name, hostnames),
    getResource: (hashUris) => featureService.getResource(hashUris),
    openDeployOverlayById: featureService.openDeployOverlayById.bind(featureService),
    getUserSettingsForOverlay: featureService.getUserSettingsForOverlay.bind(featureService),

    // GlobalConfigService
    getProfiles: globalConfigService.getProfiles.bind(globalConfigService),
    setActiveProfile: globalConfigService.setActiveProfile.bind(globalConfigService),
    renameProfile: globalConfigService.renameProfile.bind(globalConfigService),
    copyProfile: globalConfigService.copyProfile.bind(globalConfigService),
    deleteProfile: globalConfigService.deleteProfile.bind(globalConfigService),
    importProfile: globalConfigService.importProfile.bind(globalConfigService),
    exportProfile: globalConfigService.exportProfile.bind(globalConfigService),
    createShareLink: globalConfigService.createShareLink.bind(globalConfigService),
    getGlobalConfig: () => globalConfigService.get(),
    setGlobalConfig: (config) => globalConfigService.set(config),
    getDevMode: () => globalConfigService.getDevMode(),
    setDevMode: (isActive) => globalConfigService.setDevMode(isActive),
    getEvents: EventService.getEvents,
    addEvent: EventService.addEvent,
    setRead: EventService.setRead,
    deleteEvent: EventService.deleteEvent,
    deleteAllEvents: EventService.deleteEventsAll,
    getNewEventsCount: EventService.getNewEventsCount,
    getInitialConfig: () => globalConfigService.getInitialConfig(),
    // delete event
    addRegistry: (url, isDev) => globalConfigService.addRegistry(url, isDev),
    removeRegistry: (url) => globalConfigService.removeRegistry(url),
    enableRegistry: (url) => globalConfigService.enableRegistry(url),
    disableRegistry: (url) => globalConfigService.disableRegistry(url),
    getIntro: () => globalConfigService.getIntro(),
    setIntro: (intro) => globalConfigService.setIntro(intro),
    getTrustedUsers: () => globalConfigService.getTrustedUsers(),
    addTrustedUser: (account) => globalConfigService.addTrustedUser(account),
    removeTrustedUser: (account) => globalConfigService.removeTrustedUser(account),
    getAutoBackup: () => globalConfigService.getAutoBackup(),
    setAutoBackup: (isActive) => globalConfigService.setAutoBackup(isActive),
    getErrorReporting: () => globalConfigService.getErrorReporting(),
    setErrorReporting: (isActive) => globalConfigService.setErrorReporting(isActive),
    getIdentityContract: globalConfigService.getIdentityContract.bind(globalConfigService),
    getPopupInOverlay: () => globalConfigService.getPopupInOverlay(),
    setPopupInOverlay: (isActive) => globalConfigService.setPopupInOverlay(isActive),
    getUserAgentId: globalConfigService.getUserAgentId.bind(globalConfigService),
    getUserAgentName: globalConfigService.getUserAgentName.bind(globalConfigService),
    setUserAgentName: globalConfigService.setUserAgentName.bind(globalConfigService),
    getIgnoredUpdate: globalConfigService.getIgnoredUpdate.bind(globalConfigService),
    setIgnoredUpdate: globalConfigService.setIgnoredUpdate.bind(globalConfigService),
    getLastMessageSeenTimestamp:
      globalConfigService.getLastMessageSeenTimestamp.bind(globalConfigService),
    setLastMessageSeenTimestamp:
      globalConfigService.setLastMessageSeenTimestamp.bind(globalConfigService),
    getPreferedOverlayStorage:
      globalConfigService.getPreferedOverlayStorage.bind(globalConfigService),
    setPreferedOverlayStorage:
      globalConfigService.setPreferedOverlayStorage.bind(globalConfigService),
    getSwarmPostageStampId: globalConfigService.getSwarmPostageStampId.bind(globalConfigService),
    setSwarmPostageStampId: globalConfigService.setSwarmPostageStampId.bind(globalConfigService),
    getEthereumProvider: () => globalConfigService.getEthereumProvider(),
    setEthereumProvider: (url) => globalConfigService.setEthereumProvider(url),
    getXdaiProvider: () => globalConfigService.getXdaiProvider(),
    setXdaiProvider: (url) => globalConfigService.setXdaiProvider(url),
    getSwarmGateway: globalConfigService.getSwarmGateway.bind(globalConfigService),
    setSwarmGateway: globalConfigService.setSwarmGateway.bind(globalConfigService),
    getIpfsGateway: globalConfigService.getIpfsGateway.bind(globalConfigService),
    setIpfsGateway: globalConfigService.setIpfsGateway.bind(globalConfigService),
    getDynamicAdapter: globalConfigService.getDynamicAdapter.bind(globalConfigService),
    setDynamicAdapter: globalConfigService.setDynamicAdapter.bind(globalConfigService),
    getSiaPortal: globalConfigService.getSiaPortal.bind(globalConfigService),
    setSiaPortal: globalConfigService.setSiaPortal.bind(globalConfigService),
    getNearNetworks: globalConfigService.getNearNetworks.bind(globalConfigService),
    getEthereumNetworks: globalConfigService.getEthereumNetworks.bind(globalConfigService),
    getMyDapplets: globalConfigService.getMyDapplets.bind(globalConfigService),
    addMyDapplet: globalConfigService.addMyDapplet.bind(globalConfigService),
    removeMyDapplet: globalConfigService.removeMyDapplet.bind(globalConfigService),

    updateTargetStorages: globalConfigService.updateTargetStorages.bind(globalConfigService),

    getTargetStorages: globalConfigService.getTargetStorages.bind(globalConfigService),

    // UserSettings (AppStorage)
    getUserSettings: (moduleName, key) => globalConfigService.getUserSettings(moduleName, key),
    setUserSettings: (moduleName, key, value) =>
      globalConfigService.setUserSettings(moduleName, key, value),
    removeUserSettings: (moduleName, key) =>
      globalConfigService.removeUserSettings(moduleName, key),
    clearUserSettings: (moduleName) => globalConfigService.clearUserSettings(moduleName),
    getAllUserSettings: (moduleName) => globalConfigService.getAllUserSettings(moduleName),
    setAllUserSettings: (moduleName, values) =>
      globalConfigService.setAllUserSettings(moduleName, values),

    // ENS
    resolveName: (name) => ensService.resolveName(name),

    // Contract Service
    fetchJsonRpc: proxyService.fetchJsonRpc.bind(proxyService),

    // Github Service
    getNewExtensionVersion: githubService.getNewExtensionVersion.bind(githubService),
    getDevMessage: githubService.getDevMessage.bind(githubService),
    hideDevMessage: githubService.hideDevMessage.bind(githubService),

    // Discord Service
    getDiscordMessages: discordService.getDiscordMessages.bind(discordService),
    hideDiscordMessages: discordService.hideDiscordMessages.bind(discordService),

    // Identity Service
    getIdentityAccounts: identityService.getAccounts.bind(identityService),
    addIdentityAccount: identityService.addAccount.bind(identityService),

    // LocalStorage
    localStorage_setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    localStorage_getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    localStorage_removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    localStorage_clear: () => Promise.resolve(localStorage.clear()),
    localStorage_key: (index) => Promise.resolve(localStorage.key(index)),
    localStorage_length: () => Promise.resolve(localStorage.length),

    // Extension Basic
    createTab: (url) => browser.tabs.create({ url }),
    removeTab: (tabId) => browser.tabs.remove(tabId),
    updateTab: (tabId, updateProperties) => browser.tabs.update(tabId, updateProperties),
    queryTab: (queryInfo) => browser.tabs.query(queryInfo),

    // Overlay Service
    openDeployOverlay: overlayService.openDeployOverlay.bind(overlayService),
    pairWalletViaOverlay: overlayService.pairWalletViaOverlay.bind(overlayService),
    openDappletHome: overlayService.openDappletHome.bind(overlayService),
    openDappletAction: overlayService.openDappletAction.bind(overlayService),
    openPopupOverlay: overlayService.openPopupOverlay.bind(overlayService),

    // Helpers
    waitTab: (url) => waitTab(url),
    waitClosingTab: (tabId, windowId) => waitClosingTab(tabId, windowId),
    reloadCurrentPage: () => reloadCurrentPage(),
    getCurrentTab: () => getCurrentTab(),
    getThisTab: getThisTab,
    getCurrentContextIds: getCurrentContextIds,
    checkUrlAvailability: (url) => checkUrlAvailability(url),
  })
)

// WebSocket proxy
// ToDo: Perhaps a separate class WebSocketProxy is redundant
const wsproxy = new WebSocketProxy()
browser.runtime.onConnect.addListener(wsproxy.createConnectListener())

// ToDo: These lines are repeated many time
suspendService.changeIcon()
suspendService.updateContextMenus()

//listen for new tab to be activated
browser.tabs.onActivated.addListener(function (activeInfo) {
  suspendService.changeIcon()
  suspendService.updateContextMenus()
})

//listen for current tab to be changed
browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  suspendService.changeIcon()
  suspendService.updateContextMenus()
})

browser.notifications.onClicked.addListener(function (notificationId) {
  if (
    notificationId &&
    notificationId.length > 2 &&
    notificationId[0] == '0' &&
    notificationId[1] == 'x'
  ) {
    // ToDo: it's incorrect to be linked with Ethereum and Goerli only.
    const url = 'https://goerli.etherscan.io/tx/' + notificationId
    browser.tabs.create({ url: url })
  }
})

browser.commands.onCommand.addListener((cmd) => {
  if (cmd === 'toggle-overlay') {
    return getCurrentTab().then(
      (activeTab) => activeTab && browser.tabs.sendMessage(activeTab.id, 'TOGGLE_OVERLAY')
    )
  }
})

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.type) return

  if (message.type === 'CONTEXT_STARTED' || message.type === 'CONTEXT_FINISHED') {
    featureService.getActiveModulesByHostnames(message.payload.contextIds).then((manifests) => {
      if (manifests.length === 0) return

      browser.tabs.sendMessage(
        sender.tab.id,
        {
          type: message.type === 'CONTEXT_STARTED' ? 'FEATURE_ACTIVATED' : 'FEATURE_DEACTIVATED',
          payload: manifests.map((m) => ({
            name: m.name,
            version: m.version,
            branch: m.branch, // ToDo: fix branch
            order: m.order,
            contextIds: multipleReplace(
              m.hostnames,
              CONTEXT_ID_WILDCARD,
              message.payload.contextIds
            ), // ToDo: remove this map after renaming of hostnames to contextIds
          })),
        },
        {
          frameId: sender.frameId,
        }
      )
    })

    // Load adapters, providing stable context IDs.
    const idContexts = message.payload.contextIds.filter((x) => x.endsWith('/id'))
    if (idContexts.length > 0) {
      featureService.getFeaturesByHostnames(idContexts).then((manifests) => {
        const adapters = manifests.filter((x) => x.type === ModuleTypes.Adapter)
        if (adapters.length === 0) return

        browser.tabs.sendMessage(
          sender.tab.id,
          {
            type: message.type === 'CONTEXT_STARTED' ? 'FEATURE_ACTIVATED' : 'FEATURE_DEACTIVATED',
            payload: adapters.map((m) => ({
              name: m.name,
              version: 'latest',
              branch: 'default', // ToDo: fix branch
              order: m.order,
              contextIds: m.hostnames, // ToDo: remove this map after renaming of hostnames to contextIds
            })),
          },
          {
            frameId: sender.frameId,
          }
        )
      })
    }
  }
})

globalConfigService.getPopupInOverlay().then((popupInOverlay) => {
  browser.browserAction.setPopup({
    popup: popupInOverlay ? '' : 'popup.html',
  })
})

browser.browserAction.onClicked.addListener(() => overlayService.openPopupOverlay('dapplets'))

// Set predefined configuration when extension is installed
browser.runtime.onInstalled.addListener(async (details) => {
  // Find predefined config URL in downloads
  if (details.reason !== 'install') return
  const downloads = await browser.downloads.search({
    filenameRegex: 'dapplet-extension',
  })
  if (downloads.length === 0) return
  const [downloadItem] = downloads.sort((a, b) => -a.startTime.localeCompare(b.startTime))
  if (!downloadItem || !downloadItem.url) return
  const url = new URL(downloadItem.url)
  const config = url.searchParams.get('config')
  if (!config) return

  // Find override parameters in URL
  const customParams = {}
  url.searchParams.forEach((value, key) => {
    if (key !== 'config') customParams[key] = value
  })

  try {
    const url = new URL(config)
    const resp = await fetch(url.href)
    const json = await resp.json()

    const addCustomParams = (defParamsConfig: any) => {
      Object.entries(customParams).forEach(([name, value]) => {
        let parsedValue: any
        try {
          parsedValue = JSON.parse(<string>value)
        } catch (e) {
          parsedValue = value
        }
        defParamsConfig[name] = parsedValue
      })
    }

    if (Array.isArray(json)) {
      for (const j of json) {
        addCustomParams(j)
        await globalConfigService.set(j)
      }
    } else {
      addCustomParams(json)
      await globalConfigService.set(json)
    }

    console.log(`The predefined configuration was initialized. URL: ${url.href}`)
  } catch (err) {
    console.error('Cannot set predefined configuration.', err)
  }
})

browser.runtime.onInstalled.addListener(async () => {
  // disable all another instances of the current extension
  const exts = await browser.management.getAll()
  const currentExtId = browser.runtime.id
  const previousExts = exts.filter((x) => x.name === 'Dapplets' && x.id !== currentExtId)
  if (previousExts.length !== 0) {
    // const welcomeUrl = new URL(browser.runtime.getURL('welcome.html'));
    // await browser.tabs.create({ url: welcomeUrl.href });
    console.log(`Found ${previousExts.length} another instance(s) of the current extension.`)
    previousExts.forEach((x) => browser.management.setEnabled(x.id, false))
  }
})

// Reinject content scripts
if (window['DAPPLETS_JSLIB'] !== true) {
  browser.tabs
    .query({ url: ['http://*/*', 'https://*/*'] })
    .then((x) => x.filter((x) => x.status === 'complete'))
    .then((foundTabs) =>
      Promise.all(
        foundTabs.map((x) =>
          browser.tabs
            .sendMessage(x.id, { type: 'CURRENT_CONTEXT_IDS' })
            .then(() => false)
            .catch((e) => {
              browser.tabs
                .executeScript(x.id, { file: 'common.js' })
                .then(() => browser.tabs.executeScript(x.id, { file: 'contentscript.js' }))
              return true
            })
        )
      )
    )
    .then((x) => {
      const reinjectedNumber = x.filter((x) => !!x).length
      if (reinjectedNumber > 0)
        console.log(
          `${reinjectedNumber} content scripts were reinjected after background reloading.`
        )
    })

  // workaround for firefox which prevents redirect loop
  const loading = new Set<number>()

  async function redirectFromProxyServer(tab: Tabs.Tab) {
    if (tab.status === 'loading' && !loading.has(tab.id)) {
      const groups = /https:\/\/augm\.link\/live\/(.*)/gm.exec(tab.url)
      const [, targetUrl] = groups ?? []
      if (targetUrl) {
        loading.add(tab.id)
        await browser.tabs.update(tab.id, { url: targetUrl })
        setTimeout(() => loading.delete(tab.id), 300)
      }
    }
  }

  browser.tabs.onCreated.addListener(redirectFromProxyServer)
  browser.tabs.onUpdated.addListener((tabId) =>
    browser.tabs.get(tabId).then(redirectFromProxyServer)
  )
}
