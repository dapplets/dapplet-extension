import { Injector } from './injector'
import Core from './core';

var observer = new MutationObserver(() => {
    if (document.body) {
        const core = new Core(); // ToDo: is it global for all modules?
        const injector = new Injector(core);
        injector.init();
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message === "FEATURE_ACTIVATED") {
                injector.init();
            } else if (message === "FEATURE_DEACTIVATED") {
                console.log("FEATURE_DEACTIVATED");
            }
        });
        observer.disconnect();
    }
});
observer.observe(document.documentElement, { childList: true });