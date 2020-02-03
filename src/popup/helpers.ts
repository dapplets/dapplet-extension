import * as extension from 'extensionizer';

export const getCurrentContextIds = (): Promise<string[]> => new Promise((res, rej) => {
    extension.tabs.query({
        active: true,
        currentWindow: true
    }, ([currentTab]) => extension.tabs.sendMessage(currentTab.id, { "type": "CURRENT_CONTEXT_IDS" }, res));
});

export const isValidUrl = (string: string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}