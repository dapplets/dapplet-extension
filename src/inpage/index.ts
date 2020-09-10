import { Injector } from './injector'
import Core from './core';
import { browser } from "webextension-polyfill-ts";
import './index.scss';
import * as logger from '../common/logger';

window.onerror = logger.log;

const core = new Core(); // ToDo: is it global for all modules?
const injector = new Injector(core);

browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || !message.type) return;

    if (message.type === "FEATURE_ACTIVATED") {
        const features = message.payload
        features.forEach(f => console.log(`The feature ${f.name}#${f.branch}@${f.version} was activated.`));
        return injector.loadModules(features);
    } else if (message.type === "FEATURE_DEACTIVATED") {
        const features = message.payload
        features.forEach(f => console.log(`The feature ${f.name}#${f.branch}@${f.version} was deactivated.`));
        return injector.unloadModules(features);
    } else if (message.type === "CURRENT_CONTEXT_IDS") {
        return Promise.resolve(injector.availableContextIds);
    }
});