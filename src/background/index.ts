import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as SuspendService from "./services/suspendService";
import * as NotificationService from "./services/notificationService";
import FeatureService from './services/featureService';
import GlobalConfigService from './services/globalConfigService';
import * as extension from 'extensionizer';

// ToDo: Fix dublication of new FeatureService(), new GlobalConfigService() etc.
// ToDo: It looks like facade and requires a refactoring probably.
// ToDo: Think about WalletConnectService, SuspendService etc, which looks like singletons.

const featureService = new FeatureService();
const globalConfigService = new GlobalConfigService();

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
    checkDappletCompatibility: WalletConnectService.checkDappletCompatibility,
    checkDappletFramesCompatibility: WalletConnectService.checkDappletFramesCompatibility,
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
    setGlobalConfig: (config) => globalConfigService.set(config)
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
