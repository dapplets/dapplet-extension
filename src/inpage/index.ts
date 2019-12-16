import { Injector } from './injector'
import Core from './core';
import * as extension from 'extensionizer';

var observer = new MutationObserver(() => {
    if (document.body) {
        const core = new Core(); // ToDo: is it global for all modules?
        const injector = new Injector(core);
        injector.loadActiveModules();
        extension.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (!message || !message.type) return;

            if (message.type === "FEATURE_ACTIVATED") {
                const feature = message.payload
                console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was activated.`, );
                injector.loadModules([feature]);
            } else if (message.type === "FEATURE_DEACTIVATED") {
                const feature = message.payload
                console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was deactivated.`, );
                injector.unloadModules([feature]);
            } else if (message.type === "CURRENT_CONTEXT_IDS") {
                sendResponse(injector.availableContextIds);
            }
        });
        observer.disconnect();
    }
});
observer.observe(document.documentElement, { childList: true });