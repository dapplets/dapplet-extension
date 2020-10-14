import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/featureService';
import GlobalConfigService from './services/globalConfigService';
import * as EventService from './services/eventService';
import { browser } from "webextension-polyfill-ts";
import EnsService from "./services/ensService";
import { WebSocketProxy } from "../common/chrome-extension-websocket-wrapper";
import ProxyService from "./services/proxyService";
import * as logger from '../common/logger';
import { getCurrentTab } from "../common/helpers";
import * as GithubService from "./services/githubService";

// ToDo: Fix duplication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
// ToDo: Think about WalletConnectService, SuspendService etc, which looks like singletons.

window.onerror = logger.log;

const featureService = new FeatureService();
const globalConfigService = new GlobalConfigService();
const ensService = new EnsService();
const proxyService = new ProxyService();

browser.runtime.onMessage.addListener(
  setupMessageListener({
    // WalletConnectService
    loadSowa: WalletConnectService.loadSowa,
    generateUri: WalletConnectService.generateUri,
    checkConnection: WalletConnectService.checkConnection,
    waitPairing: WalletConnectService.waitPairing,
    disconnect: WalletConnectService.disconnect,
    getAccounts: WalletConnectService.getAccounts,
    getChainId: WalletConnectService.getChainId,
    loadSowaFrames: WalletConnectService.loadSowaFrames,
    sendLegacyTransaction: WalletConnectService.sendLegacyTransaction,
    getSowaTemplate: WalletConnectService.getSowaTemplate,
    pairWalletViaOverlay: WalletConnectService.pairWalletViaOverlay,
    sendSowaTransaction: WalletConnectService.sendSowaTransaction,
    sendCustomRequest: WalletConnectService.sendCustomRequest,
    sendTransaction: WalletConnectService.sendTransaction,

    // SuspendService
    getSuspendityByHostname: SuspendService.getSuspendityByHostname,
    getSuspendityEverywhere: SuspendService.getSuspendityEverywhere,
    suspendByHostname: SuspendService.suspendByHostname,
    suspendEverywhere: SuspendService.suspendEverywhere,
    resumeByHostname: SuspendService.resumeByHostname,
    resumeEverywhere: SuspendService.resumeEverywhere,

    // NotificationService
    transactionCreated: NotificationService.transactionCreated,
    transactionRejected: NotificationService.transactionRejected,

    // FeatureService
    getFeaturesByHostnames: (hostnames) => featureService.getFeaturesByHostnames(hostnames),
    activateFeature: (name, version, hostnames, order, registry) => featureService.activateFeature(name, version, hostnames, order, registry),
    deactivateFeature: (name, version, hostnames, order, registry) => featureService.deactivateFeature(name, version, hostnames, order, registry),
    reloadFeature: (name, version, hostnames, order, registry) => featureService.reloadFeature(name, version, hostnames, order, registry),
    getActiveModulesByHostnames: (hostnames) => featureService.getActiveModulesByHostnames(hostnames),
    getModulesWithDeps: (modules) => featureService.getModulesWithDeps(modules),
    optimizeDependency: (name, branch, version, contextIds) => featureService.optimizeDependency(name, branch, version, contextIds),
    getAllDevModules: () => featureService.getAllDevModules(),
    deployModule: (mi, vi, targetStorage, targetRegistry) => featureService.deployModule(mi, vi, targetStorage, targetRegistry),
    getRegistries: () => featureService.getRegistries(),
    getOwnership: (registryUri, moduleName) => featureService.getOwnership(registryUri, moduleName),
    getVersionInfo: (registryUri, moduleName, branch, version) => featureService.getVersionInfo(registryUri, moduleName, branch, version),
    transferOwnership: (registryUri, moduleName, address) => featureService.transferOwnership(registryUri, moduleName, address),
    addLocation: (registryUri, moduleName, location) => featureService.addLocation(registryUri, moduleName, location),
    removeLocation: (registryUri, moduleName, location) => featureService.removeLocation(registryUri, moduleName, location),
    getVersions: (registryUri, moduleName) => featureService.getVersions(registryUri, moduleName),
    openSettingsOverlay: (mi) => featureService.openSettingsOverlay(mi),
    openDappletAction: (name, tabId) => featureService.openDappletAction(name, tabId),

    // GlobalConfigService
    getGlobalConfig: () => globalConfigService.get(),
    setGlobalConfig: (config) => globalConfigService.set(config),
    getDevMode: () => globalConfigService.getDevMode(),
    setDevMode: (isActive) => globalConfigService.setDevMode(isActive),
    getEvents: EventService.getEvents,
    addEvent: EventService.addEvent,
    setRead: EventService.setRead,
    getNewEventsCount: EventService.getNewEventsCount,
    addRegistry: (url, isDev) => globalConfigService.addRegistry(url, isDev),
    removeRegistry: (url) => globalConfigService.removeRegistry(url),
    getIntro: () => globalConfigService.getIntro(),
    setIntro: (intro) => globalConfigService.setIntro(intro),
    getTrustedUsers: () => globalConfigService.getTrustedUsers(),
    addTrustedUser: (account) => globalConfigService.addTrustedUser(account),
    removeTrustedUser: (account) => globalConfigService.removeTrustedUser(account),
    getAutoBackup: () => globalConfigService.getAutoBackup(),
    setAutoBackup: (isActive) => globalConfigService.setAutoBackup(isActive),
    getErrorReporting: () => globalConfigService.getErrorReporting(),
    setErrorReporting: (isActive) => globalConfigService.setErrorReporting(isActive),

    // UserSettings (AppStorage)
    getUserSettings: (moduleName, key) => globalConfigService.getUserSettings(moduleName, key),
    setUserSettings: (moduleName, key, value) => globalConfigService.setUserSettings(moduleName, key, value),
    getAllUserSettings: (moduleName) => globalConfigService.getAllUserSettings(moduleName),
    setAllUserSettings: (moduleName, values) => globalConfigService.setAllUserSettings(moduleName, values),
    removeUserSettings: (moduleName, key) => globalConfigService.removeUserSettings(moduleName, key),
    clearUserSettings: (moduleName) => globalConfigService.clearUserSettings(moduleName),
    loadUserSettings: (url) => globalConfigService.loadUserSettings(url),
    saveUserSettings: () => globalConfigService.saveUserSettings(),

    // ENS
    resolveName: (name) => ensService.resolveName(name),

    // Contract Service
    fetchJsonRpc: (method, params) => proxyService.fetchJsonRpc(method, params),

    // Github Service
    isExtensionUpdateAvailable: () => GithubService.isExtensionUpdateAvailable()
  })
);

// WebSocket proxy
// ToDo: Perhaps a separate class WebSocketProxy is redundant
const wsproxy = new WebSocketProxy();
browser.runtime.onConnect.addListener(wsproxy.createConnectListener());

// ToDo: These lines are repeated many time
SuspendService.changeIcon();
SuspendService.updateContextMenus();

//listen for new tab to be activated
browser.tabs.onActivated.addListener(function (activeInfo) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

//listen for current tab to be changed
browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

browser.notifications.onClicked.addListener(function (notificationId) {
  if (
    notificationId &&
    notificationId.length > 2 &&
    notificationId[0] == "0" &&
    notificationId[1] == "x"
  ) {
    // ToDo: it's incorrect to be linked with Ethereum and Rinkeby only.
    var url = "https://rinkeby.etherscan.io/tx/" + notificationId;
    browser.tabs.create({ url: url });
  }
});

browser.commands.onCommand.addListener((cmd) => {
  if (cmd === "toggle-overlay") {
    return getCurrentTab().then((activeTab) => browser.tabs.sendMessage(activeTab.id, "TOGGLE_OVERLAY"));
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.type) return;

  if (message.type === "CONTEXT_STARTED" || message.type === "CONTEXT_FINISHED") {
    return featureService.getActiveModulesByHostnames(message.payload.contextIds).then(manifests => {
      if (manifests.length === 0) return;

      browser.tabs.sendMessage(sender.tab.id, {
        type: message.type === "CONTEXT_STARTED" ? "FEATURE_ACTIVATED" : "FEATURE_DEACTIVATED",
        payload: manifests.map(m => ({
          name: m.name,
          version: m.version,
          branch: m.branch, // ToDo: fix branch
          order: m.order,
          contextIds: m.hostnames  // ToDo: remove this map after renaming of hostnames to contextIds
        }))
      });
    });
  }
});