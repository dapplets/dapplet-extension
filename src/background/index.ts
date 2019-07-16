import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/FeatureService';
import GlobalConfigService from './services/GlobalConfigService';

// ToDo: Fix dublication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
// ToDo: Think about WalletConnectService, SuspendService etc, which looks like singletons.
chrome.runtime.onMessage.addListener(
  setupMessageListener({
    // WalletConnectService
    loadDapplet: WalletConnectService.loadDapplet,
    generateUri: WalletConnectService.generateUri,
    checkConnection: WalletConnectService.checkConnection,
    waitPairing: WalletConnectService.waitPairing,
    disconnect: WalletConnectService.disconnect,
    getAccounts: WalletConnectService.getAccounts,
    getChainId: WalletConnectService.getChainId,

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
    getScriptById: (id) => (new FeatureService()).getScriptById(id),
    getActiveFeatureIdsByHostname: (hostname) => (new FeatureService()).getActiveFeatureIdsByHostname(hostname),
    getFeaturesByHostname: (hostname) => (new FeatureService()).getFeaturesByHostname(hostname),
    syncFeaturesByHostname: (hostname) => (new FeatureService()).syncFeaturesByHostname(hostname),
    activateFeature: (id, hostname) => (new FeatureService()).activateFeature(id, hostname),
    deactivateFeature: (id, hostname) => (new FeatureService()).deactivateFeature(id, hostname),
    getDevScriptsByHostname: (hostname) => (new FeatureService()).getDevScriptsByHostname(hostname),
    getActiveModulesByHostname: (hostname) => (new FeatureService()).getActiveModulesByHostname(hostname),

    // GlobalConfigService
    getGlobalConfig: () => (new GlobalConfigService()).get(),
    setGlobalConfig: (config) => (new GlobalConfigService()).set(config)
  })
);

// ToDo: These lines are repeated many time
SuspendService.changeIcon();
SuspendService.updateContextMenus();

//listen for new tab to be activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

//listen for current tab to be changed
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  SuspendService.changeIcon();
  SuspendService.updateContextMenus();
});

chrome.notifications.onClicked.addListener(function(notificationId) {
  if (
    notificationId &&
    notificationId.length > 2 &&
    notificationId[0] == "0" &&
    notificationId[1] == "x"
  ) {
    var url = "https://rinkeby.etherscan.io/tx/" + notificationId;
    chrome.tabs.create({ url: url });
  }
});
