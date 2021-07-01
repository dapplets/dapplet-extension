import { browser } from 'webextension-polyfill-ts';
import { getCurrentTab } from '../../common/helpers';

export class GuideService {

  public async openGuideOverlay(): Promise<void> {
      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const [error, result] = await browser.tabs.sendMessage(activeTab.id, {
          type: "OPEN_GUIDE_OVERLAY",
          payload: {
              topic: 'pair',
              args: []
          }
      });
      // ToDo: use native throw in error
      if (error) throw new Error(error);
      return result;
  }

}