import { browser, Tabs } from "webextension-polyfill-ts";

export const getCurrentContextIds = async (): Promise<string[]> => {
    const tab = await getCurrentTab();
    return browser.tabs.sendMessage(tab.id, { "type": "CURRENT_CONTEXT_IDS" });
};

export const getCurrentTab = async (): Promise<Tabs.Tab> => {
    const params = new URLSearchParams(location.search); // For automated testing open popup in separated tab with URL /popup.html?tabUrl=https://example.com
    const url = params.get('tabUrl');
    const [currentTab] = await browser.tabs.query(url ? { url: url } : { currentWindow: true, active: true });
    return currentTab;
}

export const isValidUrl = (input: string) => {
    try {
        new URL(input);
        return true;
    } catch (_) {
        return input.indexOf('0x') !== -1 ? true : (input.indexOf('.eth') !== -1 ? true : false);
    }
}

export const isValidHttp = (url: string) => {
    try {
        new URL(url);
    } catch (_) {
        return false;
    }

    return true;
}