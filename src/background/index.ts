import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/FeatureService';

// ToDo: It's look like Singleton. Is it right?
const featureService = new FeatureService();

chrome.runtime.onMessage.addListener(
  setupMessageListener({
    loadDapplet: WalletConnectService.loadDapplet,
    generateUri: WalletConnectService.generateUri,
    checkConnection: WalletConnectService.checkConnection,
    waitPairing: WalletConnectService.waitPairing,
    disconnect: WalletConnectService.disconnect,
    getAccounts: WalletConnectService.getAccounts,
    getChainId: WalletConnectService.getChainId,
    getSuspendityByHostname: SuspendService.getSuspendityByHostname,
    getSuspendityEverywhere: SuspendService.getSuspendityEverywhere,
    suspendByHostname: SuspendService.suspendByHostname,
    suspendEverywhere: SuspendService.suspendEverywhere,
    resumeByHostname: SuspendService.resumeByHostname,
    resumeEverywhere: SuspendService.resumeEverywhere,
    transactionCreated: NotificationService.transactionCreated,
    transactionRejected: NotificationService.transactionRejected,

    getScriptById: (id) => featureService.getScriptById(id),
    getActiveFeatureIdsByHostname: (hostname) => featureService.getActiveFeatureIdsByHostname(hostname),
    getFeaturesByHostname: (hostname) => featureService.getFeaturesByHostname(hostname),
    syncFeaturesByHostname: (hostname) => featureService.syncFeaturesByHostname(hostname),
    activateFeature: (id, hostname) => featureService.activateFeature(id, hostname),
    deactivateFeature: (id, hostname) => featureService.deactivateFeature(id, hostname),
    addDevScript: (id, url, hostname) => featureService.addDevScript(id, url, hostname),
    deleteDevScript: (id, hostname) => featureService.deleteDevScript(id, hostname),
    getDevScriptsByHostname: (hostname) => featureService.getDevScriptsByHostname(hostname)
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