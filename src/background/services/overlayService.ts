import { browser } from "webextension-polyfill-ts";
import { getCurrentTab } from "../../common/helpers";
import { ChainTypes, DefaultConfig, DefaultSigners, LoginRequest, SystemOverlayTabs, WalletTypes } from "../../common/types";
import ManifestDTO from "../dto/manifestDTO";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export class OverlayService {

    public async openDeployOverlay(mi: ModuleInfo, vi: VersionInfo) {
        return await this._openOverlay("OPEN_DEPLOY_OVERLAY", { mi, vi });
    }

    public async pairWalletViaOverlay(chains: ChainTypes | ChainTypes[] | null, app: string | DefaultSigners, tabId: number): Promise<void> {
        const arr = !chains ? [ChainTypes.ETHEREUM_GOERLI, ChainTypes.NEAR_MAINNET, ChainTypes.NEAR_TESTNET] : Array.isArray(chains) ? chains : [chains];
        const loginRequest = { authMethods: arr, secureLogin: 'disabled' };
        return await this._openOverlay("OPEN_SYSTEM_OVERLAY", { payload: { app, loginRequest}, activeTab: SystemOverlayTabs.LOGIN_SESSION }, tabId); 
    }

    public async loginViaOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<void> {
        return await this._openOverlay("OPEN_SYSTEM_OVERLAY", { payload: { app, loginRequest}, activeTab: SystemOverlayTabs.LOGIN_SESSION  }, tabId);
    }

    public async selectWalletViaOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<void> {
        return await this._openOverlay("OPEN_SYSTEM_OVERLAY", { payload: { app, loginRequest}, activeTab: SystemOverlayTabs.LOGIN_SESSION  }, tabId);
    }

    public async openLoginSessionOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<{ wallet: WalletTypes, chain: ChainTypes, confirmationId?: string }> {
        return await this._openOverlay("OPEN_SYSTEM_OVERLAY", { payload: { app, loginRequest}, activeTab: SystemOverlayTabs.LOGIN_SESSION  }, tabId);
    }

    public async openPopupOverlay(path: string) {
        return await this._openOverlay('OPEN_POPUP_OVERLAY', { path });
    }

    public async openDappletHome(moduleName: string, tabId: number) {
        return await this._openOverlay('OPEN_DAPPLET_HOME', { moduleName }, tabId);
    }

    public async openDappletAction(moduleName: string, tabId: number) {
        return await this._openOverlay('OPEN_DAPPLET_ACTION', { moduleName }, tabId);
    }

    public async openSettingsOverlay(mi: ManifestDTO, vi: VersionInfo, schemaConfig: any, defaultConfig: DefaultConfig) {
        return await this._openOverlay('OPEN_SETTINGS_OVERLAY', { mi, vi, schemaConfig, defaultConfig });
    }

    public async openGuideOverlay(): Promise<void> {
        return await this._openOverlay('OPEN_GUIDE_OVERLAY', { topic: 'pair', args: [] });
    }

    public async sendDataToPairingOverlay(topic: string, args: any[]) {
        return await this._openOverlay('OPEN_PAIRING_OVERLAY', { topic, args });
    }

    private async _openOverlay(type: string, payload: any, tabId: number = null) {
        if (tabId === null) {
            const activeTab = await getCurrentTab();
            if (!activeTab) return;
            tabId = activeTab.id;
        }

        const [error, result] = await browser.tabs.sendMessage(tabId, {
            type,
            payload
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }
}