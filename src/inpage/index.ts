import { Injector } from './injector'
import Core from './core';
import { browser } from "webextension-polyfill-ts";
import './index.scss';
import * as tracing from '../common/tracing';

tracing.startTracing();

const core = new Core(); // ToDo: is it global for all modules?
const injector = new Injector(core);

browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || !message.type) return;

    if (message.type === "FEATURE_ACTIVATED") {
        const modules = message.payload
        modules.forEach(f => console.log(`[DAPPLETS]: The module ${f.name}${(f.branch) ? '#' + f.branch : ''}${(f.version) ? '@' + f.version : ''} was activated.`));
        return injector.loadModules(modules);
    } else if (message.type === "FEATURE_DEACTIVATED") {
        const modules = message.payload
        modules.forEach(f => console.log(`[DAPPLETS]: The module ${f.name}${(f.branch) ? '#' + f.branch : ''}${(f.version) ? '@' + f.version : ''} was deactivated.`));
        return injector.unloadModules(modules);
    } else if (message.type === "CURRENT_CONTEXT_IDS") {
        return Promise.resolve(injector.availableContextIds);
    } else if (message.type === "OPEN_DAPPLET_ACTION") {
        const { moduleName } = message.payload
        return injector.openDappletAction(moduleName);
    } else if (message.type === "OPEN_DAPPLET_HOME") {
        const { moduleName } = message.payload
        return injector.openDappletHome(moduleName);
    }
});

browser.runtime.connect().onDisconnect.addListener(() => {
    console.log('[DAPPLETS]: The connection to the background service has been lost. Content script is unloading...');
    injector.dispose();
    core.overlayManager.destroy();
});