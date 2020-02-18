import { Injector } from './injector'
import Core from './core';
import * as extension from 'extensionizer';
import './index.scss';

const core = new Core(); // ToDo: is it global for all modules?
const injector = new Injector(core);
extension.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "FEATURE_ACTIVATED") {
        const feature = message.payload
        console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was activated.`);
        await injector.loadModules([feature]);
    } else if (message.type === "FEATURE_DEACTIVATED") {
        const feature = message.payload
        console.log(`The feature ${feature.name}#${feature.branch}@${feature.version} was deactivated.`);
        await injector.unloadModules([feature]);
    } else if (message.type === "CURRENT_CONTEXT_IDS") {
        sendResponse(injector.availableContextIds);
    }
});