import "../resources/img/icon-128.png";
import "../resources/img/icon-34.png";
import { setupMessageListener } from "chrome-extension-message-wrapper";
import * as WalletConnectService from "./services/walletConnectService";
import * as InjectorService from "./services/injectorService";
import * as SuspendService from "./services/suspendService";

chrome.runtime.onMessage.addListener(
  setupMessageListener({
    loadDapplet: WalletConnectService.loadDapplet,
    generateUri: WalletConnectService.generateUri,
    checkConnection: WalletConnectService.checkConnection,
    waitPairing: WalletConnectService.waitPairing,
    getInjectorScriptByUrl: InjectorService.getInjectorScriptByUrl,
    getActiveInjectorsByHostname: InjectorService.getActiveInjectorsByHostname,
    getInjectorsByHostname: InjectorService.getInjectorsByHostname,
    setActiveInjector: InjectorService.setActiveInjector,
    getSuspendityByHostname: SuspendService.getSuspendityByHostname,
    getSuspendityEverywhere: SuspendService.getSuspendityEverywhere,
    suspendByHostname: SuspendService.suspendByHostname,
    suspendEverywhere: SuspendService.suspendEverywhere,
    resumeByHostname: SuspendService.resumeByHostname,
    resumeEverywhere: SuspendService.resumeEverywhere
  })
);

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
