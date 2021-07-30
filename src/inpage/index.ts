import { Injector } from './injector'
import Core from './core';
import { browser } from "webextension-polyfill-ts";
import './index.scss';
import * as tracing from '../common/tracing';
import { IframeMessenger } from './iframeMessenger';
import { OverlayManagerIframe } from './overlay/iframe/overlayManager';
import { OverlayManager } from './overlay/root/overlayManager';
import { IOverlay } from './overlay/interfaces';
import { assertFullfilled, timeoutPromise } from '../common/helpers';

// do not inject to overlays frames
if (window.name !== 'dapplet-overlay') {

    tracing.startTracing();

    const isIframe = self !== top;

    const iframeMessenger = new IframeMessenger();
    const overlayManager = (isIframe) ? new OverlayManagerIframe(iframeMessenger) : new OverlayManager(iframeMessenger);
    const core = new Core(isIframe, overlayManager); // ToDo: is it global for all modules?
    const injector = new Injector(core);

    const getAllContextIds = async (): Promise<string[]> => {
        const contextIDs = [...injector.availableContextIds];
        const frameResults = await Promise.allSettled((Array.from(window.frames).map(x => timeoutPromise(300, iframeMessenger.call('CURRENT_CONTEXT_IDS', [], x)))));
        frameResults.filter(assertFullfilled).forEach(x => contextIDs.push(...x.value));
        return Array.from(new Set(contextIDs)); // deduplicate array
    };

    browser.runtime.onMessage.addListener((message, sender) => {
        if (!message || !message.type) return;

        if (message.type === "FEATURE_ACTIVATED") {
            const modules = message.payload.filter(x => x.contextIds.filter(v => injector.availableContextIds.includes(v)).length > 0);
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
        iframeMessenger.destroy();
        injector.dispose();
        core.overlayManager.destroy();
    });

    const overlayMap = new Map<string, IOverlay>();

    iframeMessenger.on('CURRENT_CONTEXT_IDS', getAllContextIds);

    iframeMessenger.on('OVERLAY_CREATE', (id: string, uri: string, title: string, hidden: boolean, source: any) => {
        const overlay = overlayManager.createOverlay(uri, title, hidden);
        overlay.onregisteredchange = (v) => iframeMessenger.call('OVERLAY_REGISTERED_CHANGE', [id, v], source);
        overlay.onMessage((topic, message) => iframeMessenger.call('OVERLAY_EXEC', [id, topic, message], source));
        overlayMap.set(id, overlay);
        return true;
    });

    iframeMessenger.on('OVERLAY_OPEN', async (id: string) => {
        return new Promise((res) => overlayMap.get(id)?.open(res));
    });

    iframeMessenger.on('OVERLAY_CLOSE', (id: string) => {
        overlayMap.get(id)?.close();
        return true;
    });

    iframeMessenger.on('OVERLAY_SEND', (id: string, topic: string, args: any[]) => {
        overlayMap.get(id)?.send(topic, args);
        return true;
    });

    iframeMessenger.on('OVERLAY_EXEC', (id: string, topic: string, message: any) => {
        return overlayMap.get(id)?.exec(topic, message);
    });

}