import { Injector } from './injector'
import Core from './core';
import * as extension from 'extensionizer';
import './index.scss';

const core = new Core(); // ToDo: is it global for all modules?
const injector = new Injector(core);
extension.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "FEATURE_ACTIVATED") {
        const features = message.payload
        features.forEach(f => console.log(`The feature ${f.name}#${f.branch}@${f.version} was activated.`));
        await injector.loadModules(features);
    } else if (message.type === "FEATURE_DEACTIVATED") {
        const features = message.payload
        features.forEach(f => console.log(`The feature ${f.name}#${f.branch}@${f.version} was deactivated.`));
        await injector.unloadModules(features);
    } else if (message.type === "CURRENT_CONTEXT_IDS") {
        sendResponse(injector.availableContextIds);
    }
});