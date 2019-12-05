import { Injector } from './injector'
import Core from './core';

var observer = new MutationObserver(() => {
    if (document.body) {
        const core = new Core(); // ToDo: is it global for all modules?
        const injector = new Injector(core);
        injector.loadActiveModules();
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (!message || !message.type || !message.payload) return;
            const feature = message.payload

            if (message.type === "FEATURE_ACTIVATED") {
                console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was activated.`, );
                injector.loadModules([feature]);
            } else if (message.type === "FEATURE_DEACTIVATED") {
                console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was deactivated.`, );
            }
        });
        observer.disconnect();
    }
});
observer.observe(document.documentElement, { childList: true });