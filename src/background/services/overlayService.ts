import { browser } from "webextension-polyfill-ts";
import { getCurrentTab } from "../../common/helpers";
import ModuleInfo from "../models/moduleInfo";
import VersionInfo from "../models/versionInfo";

export class OverlayService {
    async openDeployOverlay(mi: ModuleInfo, vi: VersionInfo) {
        const tab = await getCurrentTab();
        if (!tab) return;
        browser.tabs.sendMessage(tab.id, {
            type: "OPEN_DEPLOY_OVERLAY",
            payload: {
                mi, vi
            }
        });
    }
}