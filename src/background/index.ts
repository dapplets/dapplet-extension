import { setupMessageListener } from 'chrome-extension-message-wrapper'
import browser from 'webextension-polyfill'
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
import { StorageAggregator } from './moduleStorages/moduleStorage'
import { showAlertOrConfirm } from './services/alertService'
import { AnalyticsGoals, AnalyticsService } from './services/analyticsService'
import ConnectedAccountService from './services/connectedAccountService'
import DiscordService from './services/discordService'
import EnsService from './services/ensService'
import FeatureService from './services/featureService'
import GithubService from './services/githubService'
import GlobalConfigService from './services/globalConfigService'
import ModuleManagerService from './services/moduleManagerService'
import { NotificationService } from './services/notificationService'
import { OverlayService } from './services/overlayService'
import ProxyService from './services/proxyService'
import { RegistryAggregatorService } from './services/registryAggregatorService'
import { SessionService } from './services/sessionService'
import { SuspendService } from './services/suspendService'
import { TokenRegistryService } from './services/tokenomicsService'
import { UnderConstructionService } from './services/underConstructionServices'
import { WalletService } from './services/walletService'

// ToDo: Fix duplication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
tracing.startTracing()

const notificationService = new NotificationService()
const globalConfigService = new GlobalConfigService()
const analyticsService = new AnalyticsService(globalConfigService)
const suspendService = new SuspendService(globalConfigService)
const overlayService = new OverlayService()
const proxyService = new ProxyService(globalConfigService)
const githubService = new GithubService(globalConfigService)
const discordService = new DiscordService(globalConfigService)
const walletService = new WalletService(globalConfigService, overlayService)
const sessionService = new SessionService(walletService, overlayService)
const registryAggregatorService = new RegistryAggregatorService(globalConfigService, walletService)
const storageAggregator = new StorageAggregator(globalConfigService)
const moduleManagerService = new ModuleManagerService(
  globalConfigService,
  notificationService,
  storageAggregator,
  registryAggregatorService
)
const featureService = new FeatureService(
  globalConfigService,
  walletService,
  analyticsService,
  storageAggregator,
  registryAggregatorService,
  moduleManagerService
)
const ensService = new EnsService(walletService)
const connectedAccountService = new ConnectedAccountService(globalConfigService, walletService)
const tokenomicsService = new TokenRegistryService(
  globalConfigService,
  walletService,
  overlayService,
  storageAggregator
)
const underConstructionService = new UnderConstructionService(
  globalConfigService,
  walletService,
  overlayService,
  storageAggregator
)

// ToDo: fix circular dependencies
walletService.sessionService = sessionService
globalConfigService.ensService = ensService

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
    eth_sendCustomRequestToWallet: walletService.eth_sendCustomRequestToWallet.bind(walletService),
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

    // SuspendService
    getSuspendityByHostname: suspendService.getSuspendityByHostname.bind(suspendService),
    getSuspendityEverywhere: suspendService.getSuspendityEverywhere.bind(suspendService),
    suspendByHostname: suspendService.suspendByHostname.bind(suspendService),
    suspendEverywhere: suspendService.suspendEverywhere.bind(suspendService),
    resumeByHostname: suspendService.resumeByHostname.bind(suspendService),
    resumeEverywhere: suspendService.resumeEverywhere.bind(suspendService),

    // FeatureService
    getFeaturesByHostnames: (hostnames, filter) =>
      featureService.getFeaturesByHostnames(hostnames, filter),
    activateFeature: featureService.activateFeature.bind(featureService),
    deactivateFeature: featureService.deactivateFeature.bind(featureService),
    reloadFeature: featureService.reloadFeature.bind(featureService),
    getActiveModulesByHostnames: (hostnames) =>
      featureService.getActiveModulesByHostnames(hostnames),
    getModulesWithDeps: (modules) => featureService.getModulesWithDeps(modules),
    getAllDevModules: () => featureService.getAllDevModules(),
    uploadModule: (mi, vi, targetStorages) => featureService.uploadModule(mi, vi, targetStorages),
    deployModule: (mi, vi, targetStorages, targetRegistry) =>
      featureService.deployModule(mi, vi, targetStorages, targetRegistry),
    getRegistries: () => featureService.getRegistries(),
    getOwnership: (registryUri, moduleName) => featureService.getOwnership(registryUri, moduleName),
    getModuleNftUrl: (registryUri, moduleName) =>
      featureService.getModuleNftUrl(registryUri, moduleName),
    getVersionInfo: (registryUri, moduleName, branch, version) =>
      featureService.getVersionInfo(registryUri, moduleName, branch, version),
    getModuleInfoByName: (registryUri, moduleName) =>
      featureService.getModuleInfoByName(registryUri, moduleName),
    transferOwnership: (registryUri, moduleName, oldAccount, newAccount) =>
      featureService.transferOwnership(registryUri, moduleName, oldAccount, newAccount),
    getContextIds: featureService.getContextIds.bind(featureService),
    addContextId: (registryUri, moduleName, contextId) =>
      featureService.addContextId(registryUri, moduleName, contextId),
    removeContextId: (registryUri, moduleName, contextId) =>
      featureService.removeContextId(registryUri, moduleName, contextId),
    getAdmins: featureService.getAdmins.bind(featureService),
    addAdmin: (registryUri, moduleName, adressAdmin) =>
      featureService.addAdmin(registryUri, moduleName, adressAdmin),
    removeAdmin: (registryUri, moduleName, adressAdmin) =>
      featureService.removeAdmin(registryUri, moduleName, adressAdmin),
    editModuleInfo: (registryUri, targetStorages, module) =>
      featureService.editModuleInfo(registryUri, targetStorages, module),
    getVersions: (registryUri, moduleName) => featureService.getVersions(registryUri, moduleName),
    removeDapplet: (name, hostnames) => featureService.removeDapplet(name, hostnames),
    getResource: (hashUris) => featureService.getResource(hashUris),
    getUserSettingsForOverlay: featureService.getUserSettingsForOverlay.bind(featureService),

    // GlobalConfigService
    setIsFirstInstallation: globalConfigService.setIsFirstInstallation.bind(globalConfigService),
    getIsFirstInstallation: globalConfigService.getIsFirstInstallation.bind(globalConfigService),
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
    getNotifications: (type) => notificationService.getNotifications(type),
    createAndShowNotification: (notify, tabId) =>
      notificationService.createAndShowNotification(notify, tabId),
    createNotification: (notify) => notificationService.createNotification(notify),
    showNotification: (notificationId, tabId) =>
      notificationService.showNotification(notificationId, tabId),
    deleteNotification: (id) => notificationService.deleteNotification(id),
    deleteAllNotifications: () => notificationService.deleteAllNotifications(),
    markNotificationAsViewed: (id) => notificationService.markNotificationAsViewed(id),
    markAllNotificationsAsViewed: () => notificationService.markAllNotificationsAsViewed(),
    // todo: mocked ucservices
    getCounterStake: (appId) => underConstructionService.getCounterStake(appId),
    resolveNotificationAction:
      notificationService.resolveNotificationAction.bind(notificationService),
    getUnreadNotificationsCount: (source?) =>
      notificationService.getUnreadNotificationsCount(source),
    getErc20TokenInfo: (tokenAddress) => tokenomicsService.getErc20TokenInfo(tokenAddress),
    saveBlobToIpfs: (blob, targetStorages) =>
      tokenomicsService.saveBlobToIpfs(blob, targetStorages),
    getTokensByApp: (appId) => tokenomicsService.getTokensByApp(appId),
    getAppsByToken: (addressToken) => tokenomicsService.getAppsByToken(addressToken),
    createAppToken: (appId, symbol, name, referenceUrl, additionalCollaterals?) =>
      tokenomicsService.createAppToken(appId, symbol, name, referenceUrl, additionalCollaterals),
    linkAppWithToken: (appId, tokenAddress) =>
      tokenomicsService.linkAppWithToken(appId, tokenAddress),
    getInitialConfig: () => globalConfigService.getInitialConfig(),
    addRegistry: (url, isDev) => globalConfigService.addRegistry(url, isDev),
    removeRegistry: (url) => globalConfigService.removeRegistry(url),
    enableRegistry: (url) => globalConfigService.enableRegistry(url),
    disableRegistry: (url) => globalConfigService.disableRegistry(url),
    getTrustedUsers: () => globalConfigService.getTrustedUsers(),
    addTrustedUser: (account) => globalConfigService.addTrustedUser(account),
    containsTrustedUser: (account) => globalConfigService.containsTrustedUser(account),
    removeTrustedUser: (account) => globalConfigService.removeTrustedUser(account),
    getErrorReporting: () => globalConfigService.getErrorReporting(),
    setErrorReporting: (isActive) => globalConfigService.setErrorReporting(isActive),
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
    getNearNetworks: globalConfigService.getNearNetworks.bind(globalConfigService),
    getEthereumNetworks: globalConfigService.getEthereumNetworks.bind(globalConfigService),
    getMyDapplets: globalConfigService.getMyDapplets.bind(globalConfigService),
    addMyDapplet: globalConfigService.addMyDapplet.bind(globalConfigService),
    removeMyDapplet: globalConfigService.removeMyDapplet.bind(globalConfigService),
    updateTargetStorages: globalConfigService.updateTargetStorages.bind(globalConfigService),
    getTargetStorages: globalConfigService.getTargetStorages.bind(globalConfigService),
    getPinnedActions: globalConfigService.getPinnedActions.bind(globalConfigService),
    addPinnedActions: globalConfigService.addPinnedActions.bind(globalConfigService),
    removePinnedActions: globalConfigService.removePinnedActions.bind(globalConfigService),
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
    getNewExtensionVersion: () => githubService.getNewExtensionVersion(),
    getDevMessage: () => githubService.getDevMessage(),
    hideDevMessage: githubService.hideDevMessage.bind(githubService),

    // Discord Service
    getDiscordMessages: () => discordService.getDiscordMessages(),
    hideDiscordMessages: discordService.hideDiscordMessages.bind(discordService),

    // Extension Basic
    createTab: (url) => browser.tabs.create({ url }),
    removeTab: (tabId) => browser.tabs.remove(tabId),
    updateTab: (tabId, updateProperties) => browser.tabs.update(tabId, updateProperties),
    queryTab: (queryInfo) => browser.tabs.query(queryInfo),

    // Overlay Service
    pairWalletViaOverlay: overlayService.pairWalletViaOverlay.bind(overlayService),
    openDappletHome: overlayService.openDappletHome.bind(overlayService),
    openDappletAction: overlayService.openDappletAction.bind(overlayService),
    openPopupOverlay: overlayService.openPopupOverlay.bind(overlayService),
    openConnectedAccountsPopup: overlayService.openConnectedAccountsPopup.bind(overlayService),
    execConnectedAccountsUpdateHandler:
      overlayService.execConnectedAccountsUpdateHandler.bind(overlayService),

    // Alert & Confirm
    showAlertOrConfirm,

    // Connected Account Service
    getPreferredConnectedAccountsNetwork:
      globalConfigService.getPreferredConnectedAccountsNetwork.bind(globalConfigService),
    setPreferredConnectedAccountsNetwork:
      globalConfigService.setPreferredConnectedAccountsNetwork.bind(globalConfigService),
    getConnectedAccounts:
      connectedAccountService.getConnectedAccounts.bind(connectedAccountService),
    getConnectedAccountsMinStakeAmount:
      connectedAccountService.getMinStakeAmount.bind(connectedAccountService),
    getConnectedAccountsPendingRequests:
      connectedAccountService.getPendingRequests.bind(connectedAccountService),
    getConnectedAccountsVerificationRequest:
      connectedAccountService.getVerificationRequest.bind(connectedAccountService),
    getConnectedAccountStatus: connectedAccountService.getStatus.bind(connectedAccountService),
    getConnectedAccountsMainAccount:
      connectedAccountService.getMainAccount.bind(connectedAccountService),
    getConnectedAccountsRequestStatus:
      connectedAccountService.getRequestStatus.bind(connectedAccountService),
    requestConnectingAccountsVerification:
      connectedAccountService.requestVerification.bind(connectedAccountService),
    changeConnectedAccountStatus:
      connectedAccountService.changeStatus.bind(connectedAccountService),
    getConnectedAccountsPairs: connectedAccountService.getPairs.bind(connectedAccountService),
    getConnectedAccountsNet: connectedAccountService.getNet.bind(connectedAccountService),
    areConnectedAccounts: connectedAccountService.areConnected.bind(connectedAccountService),

    // Analytics Service
    track: analyticsService.track.bind(analyticsService),

    // Helpers
    waitTab: (url) => waitTab(url),
    waitClosingTab: (tabId, windowId) => waitClosingTab(tabId, windowId),
    reloadCurrentPage: () => reloadCurrentPage(),
    getCurrentTab: () => getCurrentTab(),
    getThisTab: getThisTab,
    getCurrentContextIds: getCurrentContextIds,
    checkUrlAvailability: (url) => checkUrlAvailability(url),
    getURL: (path) => Promise.resolve(browser.runtime.getURL(path)),

    browserStorage_get: (key) => browser.storage.local.get(key),
    browserStorage_set: (kv) => browser.storage.local.set(kv),
    browserStorage_remove: (key) => browser.storage.local.remove(key),

    // For E2E tests only
    wipeAllExtensionData: () => browser.storage.local.clear(),
  })
)

// WebSocket proxy
// ToDo: Perhaps a separate class WebSocketProxy is redundant
const wsproxy = new WebSocketProxy()
browser.runtime.onConnect.addListener(wsproxy.createConnectListener())

// ToDo: These lines are repeated many time
// suspendService.changeIcon()
// suspendService.updateContextMenus()

// //listen for new tab to be activated
// browser.tabs.onActivated.addListener(() => {
//   suspendService.changeIcon()
//   suspendService.updateContextMenus()
// })

// //listen for current tab to be changed
// browser.tabs.onUpdated.addListener(() => {
//   suspendService.changeIcon()
//   suspendService.updateContextMenus()
// })

// ToDo: remove or restore this function
// browser.commands.onCommand.addListener((cmd) => {
//   if (cmd === 'toggle-overlay') {
//     return getCurrentTab().then(
//       (activeTab) => activeTab && browser.tabs.sendMessage(activeTab.id, 'TOGGLE_OVERLAY')
//     )
//   }
// })

async function fetchPlain({
  url,
  objectUrl,
  options,
}: {
  url: string
  objectUrl?: string
  options: RequestInit
}) {
  let requestBlob: Blob = undefined
  if (objectUrl) {
    requestBlob = await fetch(objectUrl).then((x) => x.blob())
    URL.revokeObjectURL(objectUrl)
  }

  const request = new Request(url, { ...options, body: requestBlob })

  const response = await fetch(request)
  const responseBlob = await response.blob()
  const responseObjectUrl = URL.createObjectURL(responseBlob)

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    objectUrl: responseObjectUrl,
  }
}

// Proxify fetch-requests to deal with CORS
// It's used by Core.fetch()
browser.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) return

  if (message.type === 'FETCH_REQUEST') {
    return fetchPlain(message.payload)
  }
})

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.type) return

  if (message.type === 'CONTEXT_STARTED' || message.type === 'CONTEXT_FINISHED') {
    featureService.getActiveModulesByHostnames(message.payload.contextIds).then((manifests) => {
      if (manifests.length === 0) return

      // ToDo: use global dapplet_activated event instead of FEATURE_ACTIVATED
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
      featureService.getFeaturesByHostnames(idContexts, null).then((manifests) => {
        const adapters = manifests.filter(
          (x) => x.type === ModuleTypes.Adapter || x.type === ModuleTypes.ParserConfig
        )
        if (adapters.length === 0) return

        // ToDo: use global dapplet_activated event instead of FEATURE_ACTIVATED
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

const overlayPopupOpen = (tab: browser.Tabs.Tab) => {
  overlayService.openPopupOverlay('dapplets', tab.id)
  analyticsService.track({ idgoal: AnalyticsGoals.ExtensionIconClicked })
}

browser.tabs.onActivated.addListener(async (activeInfo) => {
  const infoActivaTab = await browser.tabs.get(activeInfo.tabId)

  if (!infoActivaTab) return

  if (!infoActivaTab.url.startsWith('https://') && !infoActivaTab.url.startsWith('http://')) {
    const popupUrl = browser.runtime.getURL('popup.html')

    await browser.action.setPopup({ tabId: activeInfo.tabId, popup: popupUrl })
    browser.action.onClicked.removeListener(overlayPopupOpen)
  } else {
    await browser.action.setPopup({ tabId: infoActivaTab.id, popup: '' })

    browser.action.onClicked.addListener(overlayPopupOpen)
  }
})

browser.tabs.onUpdated.addListener((tabId: number, changeInfo: object, tab: browser.Tabs.Tab) => {
  if (!tab.url.startsWith('https://') && !tab.url.startsWith('http://')) {
    const popupUrl = browser.runtime.getURL('popup.html')

    browser.action.setPopup({ tabId: tab.id, popup: popupUrl })
    browser.action.onClicked.removeListener(overlayPopupOpen)
  } else {
    browser.action.setPopup({ tabId: tab.id, popup: '' })

    browser.action.onClicked.addListener(overlayPopupOpen)
  }
})

// E2E testing functions
globalThis.dapplets = {
  activateDapplet: featureService.activateDappletE2E.bind(featureService),
  deactivateDapplet: featureService.deactivateDappletE2E.bind(featureService),
  addRegistry: globalConfigService.addRegistry.bind(globalConfigService),
  removeRegistry: globalConfigService.removeRegistry.bind(globalConfigService),
  enableRegistry: globalConfigService.enableRegistry.bind(globalConfigService),
  disableRegistry: globalConfigService.disableRegistry.bind(globalConfigService),
  setIsFirstInstallation: globalConfigService.setIsFirstInstallation.bind(globalConfigService),
}


// ToDo: remove or restore this code, it was commented to remove downloads permission before publishing
// Set predefined configuration when extension is installed
// browser.runtime.onInstalled.addListener(async (details) => {
//   analyticsService.track({ idgoal: AnalyticsGoals.ExtensionInstalled })

//   // Find predefined config URL in downloads
//   if (details.reason !== 'install') return
//   const downloads = await browser.downloads.search({
//     filenameRegex: 'dapplet-extension',
//   })
//   if (downloads.length === 0) return
//   const [downloadItem] = downloads.sort((a, b) => -a.startTime.localeCompare(b.startTime))
//   if (!downloadItem || !downloadItem.url) return
//   const url = new URL(downloadItem.url)
//   const config = url.searchParams.get('config')
//   if (!config) return

//   // Find override parameters in URL
//   const customParams: { [key: string]: string } = {}
//   url.searchParams.forEach((value, key) => {
//     if (key !== 'config') customParams[key] = value
//   })

//   try {
//     const url = new URL(config)
//     const resp = await fetch(url.href)
//     const json: Partial<GlobalConfig> | Partial<GlobalConfig>[] = await resp.json()

//     const addCustomParams = (defParamsConfig: Partial<GlobalConfig>) => {
//       Object.entries(customParams).forEach(([name, value]) => {
//         try {
//           defParamsConfig[name] = JSON.parse(<string>value)
//         } catch (e) {
//           defParamsConfig[name] = value
//         }
//       })
//     }

//     if (Array.isArray(json)) {
//       // ToDo: A potential bug is here. Configs override each other.
//       for (const j of json) {
//         addCustomParams(j)
//         await globalConfigService.mergeConfig(j)
//       }
//     } else {
//       addCustomParams(json)
//       await globalConfigService.mergeConfig(json)
//     }

//     console.log(`The predefined configuration was initialized. URL: ${url.href}`)
//   } catch (err) {
//     console.error('Cannot set predefined configuration.', err)
//   }
// })

// ToDo: remove or restore this code, it was commented to remove downloads permission before publishing
// browser.runtime.onInstalled.addListener(async () => {
//   // disable all another instances of the current extension
//   const exts = await browser.management.getAll()
//   const currentExtId = browser.runtime.id
//   const previousExts = exts.filter((x) => x.name === 'Dapplets' && x.id !== currentExtId)
//   if (previousExts.length !== 0) {
//     console.log(`Found ${previousExts.length} another instance(s) of the current extension.`)
//     previousExts.forEach((x) => browser.management.setEnabled(x.id, false))
//   }
// })

// Reinject content scripts
// if (typeof window === 'undefined') {
//   browser.tabs
//     .query({ url: ['http://*/*', 'https://*/*'] })
//     .then((x) => x.filter((x) => x.status === 'complete'))
//     .then((foundTabs) =>
//       Promise.all(
//         foundTabs.map((x) =>
//           browser.tabs
//             .sendMessage(x.id, { type: 'CURRENT_CONTEXT_IDS' })
//             .then(() => false)
//             .catch(() => {
//               browser.scripting.executeScript({
//                 files: ['custom-elements.min.js', 'contentscript.js'],
//                 target: { tabId: x.id },
//               })
//               return true
//             })
//         )
//       )
//     )
//     .then((x) => {
//       const reinjectedNumber = x.filter((x) => !!x).length
//       if (reinjectedNumber > 0)
//         console.log(
//           `${reinjectedNumber} content scripts were reinjected after background reloading.`
//         )
//     })

//   // workaround for firefox which prevents redirect loop
//   const loading = new Set<number>()

//   const redirectFromProxyServer = async (tab: browser.Tabs.Tab) => {
//     if (tab.status === 'loading' && !loading.has(tab.id)) {
//       const groups = /https:\/\/augm\.link\/live\/(.*)/gm.exec(tab.url)
//       const [, targetUrl] = groups ?? []
//       if (targetUrl) {
//         loading.add(tab.id)
//         await browser.tabs.update(tab.id, { url: targetUrl })
//         setTimeout(() => loading.delete(tab.id), 300)
//       }
//     }
//   }

//   browser.tabs.onCreated.addListener(redirectFromProxyServer)
//   browser.tabs.onUpdated.addListener((tabId) =>
//     browser.tabs.get(tabId).then(redirectFromProxyServer)
//   )
// }
