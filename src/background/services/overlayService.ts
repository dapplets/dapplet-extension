import { browser } from "webextension-polyfill-ts";
import { getCurrentTab } from "../../common/helpers";
import { ChainTypes, DefaultConfig, DefaultSigners, LoginRequest, SystemOverlayTabs, WalletTypes } from "../../common/types";
import ManifestDTO from "../dto/manifestDTO";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export class OverlayService {

    public async openDeployOverlay(mi: ModuleInfo, vi: VersionInfo) {
        return await this._openLegacyOverlay("OPEN_DEPLOY_OVERLAY", { mi, vi });
    }

    public async pairWalletViaOverlay(chains: ChainTypes | ChainTypes[] | null): Promise<void> {
        const arr = !chains ? [] : Array.isArray(chains) ? chains : [chains];
        return await this._openLegacyOverlay("OPEN_PAIRING_OVERLAY", { topic: 'pair', args: [arr] });
    }

    public async loginViaOverlay(app: string | DefaultSigners, chain: ChainTypes, cfg?: { username: string, domainId: number, fullname?: string, img?: string }): Promise<void> {
        return await this._openLegacyOverlay("OPEN_LOGIN_OVERLAY", { topic: 'login', args: [app, chain, cfg] });
    }

    public async selectWalletViaOverlay(app: string | DefaultSigners, chain: ChainTypes): Promise<void> {
        return await this._openLegacyOverlay("OPEN_LOGIN_OVERLAY", { topic: 'login', args: [app, chain] });
    }

    public async openLoginSessionOverlay(app: string | DefaultSigners, loginRequest: LoginRequest, tabId: number): Promise<{ wallet: WalletTypes, chain: ChainTypes, confirmationId?: string }> {
        return await this._openSystemOverlay(SystemOverlayTabs.LOGIN_SESSION, { app, loginRequest }, tabId);
    }

    public async openPopupOverlay(path: string) {
        return await this._openLegacyOverlay('OPEN_POPUP_OVERLAY', { path });
    }

    public async openDappletHome(moduleName: string, tabId: number) {
        return await this._openLegacyOverlay('OPEN_DAPPLET_HOME', { moduleName }, tabId);
    }

    public async openDappletAction(moduleName: string, tabId: number) {
        return await this._openLegacyOverlay('OPEN_DAPPLET_ACTION', { moduleName }, tabId);
    }

    public async openSettingsOverlay(mi: ManifestDTO, vi: VersionInfo, schemaConfig: any, defaultConfig: DefaultConfig) {
        return await this._openLegacyOverlay('OPEN_SETTINGS_OVERLAY', { mi, vi, schemaConfig, defaultConfig });
    }

    public async openGuideOverlay(): Promise<void> {
        return await this._openLegacyOverlay('OPEN_GUIDE_OVERLAY', { topic: 'pair', args: [] });
    }

    public async sendDataToPairingOverlay(topic: string, args: any[]) {
        return await this._openLegacyOverlay('OPEN_PAIRING_OVERLAY', { topic, args });
    }

    private async _openLegacyOverlay(type: string, payload: any, tabId?: number) {
        if (tabId === undefined) {
            const activeTab = await getCurrentTab();
            if (!activeTab) return;
            tabId = activeTab.id;
        }

        const response = await browser.tabs.sendMessage(tabId, { type, payload });

        if (response) {
            const [error, result] = response;

            // ToDo: use native throw in error
            if (error) throw new Error(error);
            return result;
        }
    }

    private async _openSystemOverlay(activeTab: SystemOverlayTabs, payload: any, targetTabId: number = null) {
        if (targetTabId === null) {
            const tab = await getCurrentTab();
            if (!tab) return;
            targetTabId = tab.id;
        }

        const [error, result] = await browser.tabs.sendMessage(targetTabId, {
            type: "OPEN_SYSTEM_OVERLAY",
            payload: { activeTab, payload }
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }
}