import { browser } from "webextension-polyfill-ts";
import { getCurrentTab } from "../../common/helpers";
import { ChainTypes, DefaultSigners, SystemOverlayTabs } from "../../common/types";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export class OverlayService {
    
    public async openDeployOverlay(mi: ModuleInfo, vi: VersionInfo) {
        return await this._openLegacyOverlay("OPEN_DEPLOY_OVERLAY", { mi, vi });
    }

    public async pairWalletViaOverlay(chain: ChainTypes): Promise<void> {
        return await this._openLegacyOverlay("OPEN_PAIRING_OVERLAY", { topic: 'pair', args: [chain] });
    }

    public async loginViaOverlay(app: string | DefaultSigners, chain: ChainTypes, cfg?: { username: string, domainId: number, fullname?: string, img?: string }): Promise<void> {
        return await this._openLegacyOverlay("OPEN_LOGIN_OVERLAY", { topic: 'login', args: [app, chain, cfg] });
    }

    public async selectWalletViaOverlay(app: string | DefaultSigners, chain: ChainTypes): Promise<void> {
        return await this._openLegacyOverlay("OPEN_LOGIN_OVERLAY", { topic: 'login', args: [app, chain] });
    }

    public async openLoginSessionOverlay(app: string | DefaultSigners, chain: ChainTypes): Promise<string> {
        return await this._openSystemOverlay(SystemOverlayTabs.LOGIN_SESSION, { app, chain });
    }

    private async _openLegacyOverlay(type: string, payload: any) {
        const activeTab = await getCurrentTab();
        if (!activeTab) return;
        const [error, result] = await browser.tabs.sendMessage(activeTab.id, { type, payload });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }

    private async _openSystemOverlay(activeTab: SystemOverlayTabs, payload: any) {
        const tab = await getCurrentTab();
        if (!tab) return;

        const [error, result] = await browser.tabs.sendMessage(tab.id, {
            type: "OPEN_SYSTEM_OVERLAY",
            payload: { activeTab, payload }
        });

        // ToDo: use native throw in error
        if (error) throw new Error(error);
        return result;
    }
}