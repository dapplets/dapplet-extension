import { Injector } from './injector'
import Core from './core';
import { browser } from "webextension-polyfill-ts";
import './index.scss';
import * as tracing from '../common/tracing';
import { JsonRpc } from '../common/jsonrpc';
import { OverlayManagerIframe } from './overlay/iframe/overlayManager';
import { OverlayManager } from './overlay/root/overlayManager';
import { IOverlay } from './overlay/interfaces';
import { assertFullfilled, timeoutPromise } from '../common/helpers';
import { CONTEXT_ID_WILDCARD } from '../common/constants';
import { initBGFunctions } from "chrome-extension-message-wrapper";

tracing.startTracing();

function init() {

    const isIframe = self !== top;

    const jsonrpc = new JsonRpc();
    const overlayManager = (isIframe) ? new OverlayManagerIframe(jsonrpc) : new OverlayManager(jsonrpc);
    const core = new Core(isIframe, overlayManager); // ToDo: is it global for all modules?
    const injector = new Injector(core);

    const getAllContextIds = async (): Promise<string[]> => {
        const contextIDs = [...injector.availableContextIds];
        const frameResults = await Promise.allSettled((Array.from(window.frames).map(x => timeoutPromise(300, jsonrpc.call('CURRENT_CONTEXT_IDS', [], x)))));
        frameResults.filter(assertFullfilled).forEach(x => contextIDs.push(...x.value));
        return Array.from(new Set(contextIDs)); // deduplicate array
    };

    browser.runtime.onMessage.addListener((message, sender) => {
        if (!message || !message.type) return;

        if (message.type === "FEATURE_ACTIVATED") {
            const modules = message.payload.filter(x => x.contextIds.filter(v => injector.availableContextIds.includes(v) || v === CONTEXT_ID_WILDCARD).length > 0);
            modules.forEach(f => console.log(`[DAPPLETS]: The module ${f.name}${(f.branch) ? '#' + f.branch : ''}${(f.version) ? '@' + f.version : ''} was activated.`));
            return injector.loadModules(modules);
        } else if (message.type === "FEATURE_DEACTIVATED") {
            const modules = message.payload;
            modules.forEach(f => console.log(`[DAPPLETS]: The module ${f.name}${(f.branch) ? '#' + f.branch : ''}${(f.version) ? '@' + f.version : ''} was deactivated.`));
            return injector.unloadModules(modules);
        } else if (!isIframe && message.type === "CURRENT_CONTEXT_IDS") {
            return getAllContextIds();
        } else if (!isIframe && message.type === "OPEN_DAPPLET_ACTION") {
            const { moduleName } = message.payload
            return injector.openDappletAction(moduleName);
        } else if (!isIframe && message.type === "OPEN_DAPPLET_HOME") {
            const { moduleName } = message.payload
            return injector.openDappletHome(moduleName);
        }
    });

    // destroy when background is disconnected
    browser.runtime.connect().onDisconnect.addListener(() => {
        console.log('[DAPPLETS]: The connection to the background service has been lost. Content script is unloading...');
        jsonrpc.destroy();
        injector.dispose();
        core.overlayManager.destroy();
    });

    const overlayMap = new Map<string, IOverlay>();

    jsonrpc.on('CURRENT_CONTEXT_IDS', getAllContextIds);

    jsonrpc.on('OVERLAY_CREATE', (id: string, uri: string, title: string, hidden: boolean, source: any) => {
        const overlay = overlayManager.createOverlay(uri, title, hidden);
        overlay.onregisteredchange = (v) => jsonrpc.call('OVERLAY_REGISTERED_CHANGE', [id, v], source);
        overlay.onMessage((topic, message) => jsonrpc.call('OVERLAY_EXEC', [id, topic, message], source));
        overlayMap.set(id, overlay);
        return true;
    });

    jsonrpc.on('OVERLAY_OPEN', async (id: string) => {
        return new Promise((res) => overlayMap.get(id)?.open(res));
    });

    jsonrpc.on('OVERLAY_CLOSE', (id: string) => {
        overlayMap.get(id)?.close();
        return true;
    });

    jsonrpc.on('OVERLAY_SEND', (id: string, topic: string, args: any[]) => {
        overlayMap.get(id)?.send(topic, args);
        return true;
    });

    jsonrpc.on('OVERLAY_EXEC', (id: string, topic: string, message: any) => {
        return overlayMap.get(id)?.exec(topic, message);
    });

    jsonrpc.on('pairWalletViaOverlay', () => {
        return initBGFunctions(browser).then(x => x.pairWalletViaOverlay(null));
    });

    jsonrpc.on('getWalletDescriptors', () => {
        return initBGFunctions(browser).then(x => x.getWalletDescriptors());
    });

    if (!isIframe) {
        injectScript(browser.runtime.getURL('inpage.js'));
    }
}

function injectScript(url: string) {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('async', 'false');
        scriptTag.src = url;
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
    } catch (error) {
        console.error('[DAPPLETS]: Dapplets API injection failed.', error);
    }
}

// do not inject to overlays frames
if (window.name.indexOf('dapplet-overlay') === -1) {
    if (window.document.body) {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', () => init());
    }
}