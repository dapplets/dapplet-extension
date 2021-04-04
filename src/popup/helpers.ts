import { browser, Tabs } from "webextension-polyfill-ts";
import { typeOfUri, UriTypes } from "../common/helpers";

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
    const type = typeOfUri(input);

    if (type === UriTypes.Ens) return true;
    if (type === UriTypes.Ethereum) return true;
    if (type === UriTypes.Near) return true;

    return false;
}

export const isValidHttp = (url: string) => {
    try {
        new URL(url);
    } catch (_) {
        return false;
    }

    return true;
}