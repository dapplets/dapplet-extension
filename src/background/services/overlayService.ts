import { browser } from "webextension-polyfill-ts";
import { getCurrentTab } from "../../common/helpers";
import { ChainTypes, DefaultConfig, DefaultSigners, LoginRequest, SystemOverlayTabs, WalletTypes } from "../../common/types";
import ManifestDTO from "../dto/manifestDTO";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export class OverlayService {

    public openDeployOverlay(mi: ModuleInfo, vi: VersionInfo) {
        return this._openOverlay("OPEN_DEPLOY_OVERLAY", { mi, vi });
    }

    public pairWalletViaOverlay(chains: ChainTypes | ChainTypes[] | null, app: string | DefaultSigners, tabId: number): Promise<void> {
        const arr = !chains ? [ChainTypes.ETHEREUM_GOERLI, ChainTypes.NEAR_MAINNET, ChainTypes.NEAR_TESTNET] : Array.isArray(chains) ? chains : [chains];
        const loginRequest = { authMethods: arr, secureLogin: 'disabled' };
        return this._openOverlay("OPEN_SYSTEM_OVERLAY", { app, loginRequest}, tabId, SystemOverlayTabs.LOGIN_SESSION); 
    }

    public loginViaOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<void> {
        return this._openOverlay("OPEN_SYSTEM_OVERLAY", { app, loginRequest}, tabId, SystemOverlayTabs.LOGIN_SESSION );
    }

    public selectWalletViaOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<void> {
        return this._openOverlay("OPEN_SYSTEM_OVERLAY", { app, loginRequest}, tabId, SystemOverlayTabs.LOGIN_SESSION);
    }

    public openLoginSessionOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<{ wallet: WalletTypes, chain: ChainTypes, confirmationId?: string }> {
        return this._openOverlay("OPEN_SYSTEM_OVERLAY", { app, loginRequest}, tabId, SystemOverlayTabs.LOGIN_SESSION);
    }

    public openPopupOverlay(path: string) {
        return this._openOverlay('OPEN_POPUP_OVERLAY', { path });
    }

    public openDappletHome(moduleName: string, tabId: number) {
        return this._openOverlay('OPEN_DAPPLET_HOME', { moduleName }, tabId);
    }

    public openDappletAction(moduleName: string, tabId: number) {
        return this._openOverlay('OPEN_DAPPLET_ACTION', { moduleName }, tabId);
    }

    public openSettingsOverlay(mi: ManifestDTO, vi: VersionInfo, schemaConfig: any, defaultConfig: DefaultConfig) {
        return this._openOverlay('OPEN_SETTINGS_OVERLAY', { mi, vi, schemaConfig, defaultConfig });
    }

    public openGuideOverlay(): Promise<void> {
        return this._openOverlay('OPEN_GUIDE_OVERLAY', { topic: 'pair', args: [] });
    }

    public sendDataToPairingOverlay(topic: string, args: any[]) {
        return this._openOverlay('OPEN_PAIRING_OVERLAY', { topic, args });
    }

    private async _openOverlay(type: string, payload: any, tabId: number = null, activeTab?: SystemOverlayTabs) {
        if (tabId === null) {
            const currentTab = await getCurrentTab();
            if (!currentTab) return;
            tabId = currentTab.id;
        }

        const [error, result] = await browser.tabs.sendMessage(tabId, {
            type,
            payload: type === "OPEN_SYSTEM_OVERLAY" ? { payload, activeTab } : payload
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }
}