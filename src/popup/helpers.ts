import { browser } from "webextension-polyfill-ts";

export const getCurrentContextIds = async (): Promise<string[]> => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    return browser.tabs.sendMessage(currentTab.id, { "type": "CURRENT_CONTEXT_IDS" });
};

export const isValidUrl = (input: string) => {
    try {
        new URL(input);
        return true;
    } catch (_) {
        return input.indexOf('0x') !== -1 ? true : (input.indexOf('.eth') !== -1 ? true : false);
    }
}