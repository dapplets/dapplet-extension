import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/featureService';
import GlobalConfigService from './services/globalConfigService';
import * as EventService from './services/eventService';
import * as extension from 'extensionizer';
import { GlobalEventBusService } from "./services/globalEventBusService";

// ToDo: Fix dublication of new FeatureService(), new GlobalConfigService() etc.
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
    getFeaturesByHostname: (hostname) => featureService.getFeaturesByHostname(hostname),
    activateFeature: (name, version, hostname) => featureService.activateFeature(name, version, hostname),
    deactivateFeature: (name, version, hostname) => featureService.deactivateFeature(name, version, hostname),
    getActiveModulesByHostname: (hostname) => featureService.getActiveModulesByHostname(hostname),
    getModulesWithDeps: (modules) => featureService.getModulesWithDeps(modules),
    optimizeDependency: (name, branch, version) => featureService.optimizeDependency(name, branch, version),

    // GlobalConfigService
    getGlobalConfig: () => globalConfigService.get(),
    setGlobalConfig: (config) => globalConfigService.set(config),

    getEvents: EventService.getEvents
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

chrome.commands.onCommand.addListener(cmd => {
  if (cmd === "toggle-overlay") {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, "TOGGLE_OVERLAY");
    });
  }
});


// chrome.tabs.query({}, tabs => tabs.forEach(t => chrome.tabs.sendMessage(t.id, message)));

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!request) return

  if (request.type === "EVENTBUS_PUBLISH") {
    const { topic, data } = request.payload
    globalEventBusService.publish(topic, data)
  }

  if (request.type === "EVENTBUS_SUBSCRIBE") {
    globalEventBusService.subscribe(
      request.payload.topic,
      (topic, data) => chrome.tabs.sendMessage(sender.tab.id, { topic, data })
    )
  }
});