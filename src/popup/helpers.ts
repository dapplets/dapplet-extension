import * as extension from 'extensionizer';

export const getCurrentContextIds = () => new Promise((res, rej) => {
    extension.tabs.query({
        active: true,
        currentWindow: true
    }, ([currentTab]) => extension.tabs.sendMessage(currentTab.id, { "type": "CURRENT_CONTEXT_IDS" }, res));
});