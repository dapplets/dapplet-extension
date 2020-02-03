import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/featureService';
import GlobalConfigService from './services/globalConfigService';
import * as EventService from './services/eventService';
import * as extension from 'extensionizer';
import { GlobalEventBusService } from "./services/globalEventBusService";

// ToDo: Fix duplication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
// ToDo: Think about WalletConnectService, SuspendService etc, which looks like singletons.

const featureService = new FeatureService();
const globalConfigService = new GlobalConfigService();
const globalEventBusService = new GlobalEventBusService();

extension.runtime.onMessage.addListener(
  setupMessageListener({
    // WalletConnectService
    loadDapplet: WalletConnectService.loadDapplet,
    generateUri: WalletConnectService.generateUri,
    checkConnection: WalletConnectService.checkConnection,
    waitPairing: WalletConnectService.waitPairing,
    disconnect: WalletConnectService.disconnect,
    getAccounts: WalletConnectService.getAccounts,
    getChainId: WalletConnectService.getChainId,
    loadDappletFrames: WalletConnectService.loadDappletFrames,
    sendLegacyTransaction: WalletConnectService.sendLegacyTransaction,

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
    activateFeature: (name, version, hostnames) => featureService.activateFeature(name, version, hostnames),
    deactivateFeature: (name, version, hostnames) => featureService.deactivateFeature(name, version, hostnames),
    getActiveModulesByHostnames: (hostnames) => featureService.getActiveModulesByHostnames(hostnames),
    getModulesWithDeps: (modules) => featureService.getModulesWithDeps(modules),
    optimizeDependency: (name, branch, version) => featureService.optimizeDependency(name, branch, version),
    getAllDevModules: () => featureService.getAllDevModules(),

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
    getRegistries: () => globalConfigService.getRegistries(),
    getIntro: () => globalConfigService.getIntro(),
    setIntro: (intro) => globalConfigService.setIntro(intro)
  })
);

// ToDo: These lines are repeated many time
SuspendService.changeIcon();
SuspendService.updateContextMenus();

//listen for new tab to be activated
extension.tabs.onActivated.addListener(function (activeInfo) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

//listen for current tab to be changed
extension.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

extension.notifications.onClicked.addListener(function (notificationId) {
  if (
    notificationId &&
    notificationId.length > 2 &&
    notificationId[0] == "0" &&
    notificationId[1] == "x"
  ) {
    var url = "https://rinkeby.etherscan.io/tx/" + notificationId;
    extension.tabs.create({ url: url });
  }
});

extension.commands.onCommand.addListener(cmd => {
  if (cmd === "toggle-overlay") {
    extension.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      var activeTab = tabs[0];
      extension.tabs.sendMessage(activeTab.id, "TOGGLE_OVERLAY");
    });
  }
});

extension.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!request) return

  if (request.type === "EVENTBUS_PUBLISH") {
    const { topic, data } = request.payload
    globalEventBusService.publish(topic, data)
  }

  if (request.type === "EVENTBUS_SUBSCRIBE") {
    globalEventBusService.subscribe(
      request.payload.topic,
      (topic, data) => extension.tabs.sendMessage(sender.tab.id, { topic, data })
    )
  }
});

extension.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === "CONTEXT_STARTED" || message.type === "CONTEXT_FINISHED") {
    const manifests = await featureService.getActiveModulesByHostnames(message.payload.contextIds);

    for (const m of manifests) {
      extension.tabs.sendMessage(sender.tab.id, {
        type: message.type === "CONTEXT_STARTED" ? "FEATURE_ACTIVATED" : "FEATURE_DEACTIVATED",
        payload: {
          name: m.name,
          version: m.version,
          branch: m.branch, // ToDo: fix branch
          order: m.order,
          contextIds: m.hostnames  // ToDo: remove this map after renaming of hostnames to contextIds
        }
      });
    }
  }
});