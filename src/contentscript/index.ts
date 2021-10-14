import { Injector } from './injector'
import Core from './core';
import { browser } from "webextension-polyfill-ts";
import './index.scss';
import * as tracing from '../common/tracing';
import { JsonRpc } from '../common/jsonrpc';
import { OverlayManagerIframe } from './overlay/iframe/overlayManager';
import { OverlayManager } from './overlay/root/overlayManager';
import { IOverlay } from './overlay/interfaces';
import { assertFullfilled, tryParseBase64Payload, parseModuleName, timeoutPromise } from '../common/helpers';
import { CONTEXT_ID_WILDCARD } from '../common/constants';
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { SystemOverlayTabs } from '../common/types';

// tracing.startTracing();

const IS_LIBRARY = window['DAPPLETS_JSLIB'] === true;

async function init() {

    const shareLinkPayload = await processShareLink().catch((e) => {
        console.error(e);
        return null;
    });

    const isIframe = self !== top;

    const jsonrpc = new JsonRpc();
    const overlayManager = (isIframe) ? new OverlayManagerIframe(jsonrpc) : new OverlayManager(jsonrpc);
    const core = new Core(isIframe, overlayManager); // ToDo: is it global for all modules?
    const injector = new Injector(core, { shareLinkPayload });

    // Open confirmation overlay if checks are not passed
    if (shareLinkPayload && !shareLinkPayload.isAllOk) {
        core.waitSystemOverlay({
            activeTab: SystemOverlayTabs.DAPPLET_CONFIRMATION,
            payload: shareLinkPayload
        });
    }

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

async function processShareLink() {
    const url = window.location.href;
    const groups = /(.*)#dapplet\/(.*)/gm.exec(url);
    const [, urlNoPayload, payloadBase64] = groups ?? [];
    if (!urlNoPayload || !payloadBase64) return;

    // window.location.href = window.location.href.replace('#dapplet/' + payloadBase64, '');

    const payload = tryParseBase64Payload(payloadBase64);
    if (!payload) return;

    const { moduleId, registry, contextIds } = payload;
    const { getModuleInfoByName, getTrustedUsers, getRegistries, getActiveModulesByHostnames, addRegistry, enableRegistry, addTrustedUser, activateFeature, deactivateFeature } = await initBGFunctions(browser);

    const registries = await getRegistries();
    const targetRegistry = registries.find(x => x.url === registry);
    const isRegistryExists = !!targetRegistry;
    if (!isRegistryExists) {
        if (IS_LIBRARY) {
            await addRegistry(registry);
        } else {
            return { ...payload, isAllOk: false };
        }
    }

    const isRegistryEnabled = isRegistryExists && targetRegistry.isEnabled;
    if (!isRegistryEnabled) {
        if (IS_LIBRARY) {
            await enableRegistry(registry);
        } else {
            return { ...payload, isAllOk: false };
        }
    }

    const targetModuleId = parseModuleName(moduleId);
    const mi = await getModuleInfoByName(registry, targetModuleId.name);
    if (!mi) throw new Error(`ShareLink: Cannot find the module "${targetModuleId.name}" in the registry "${registry}"`);

    const trustedUsers = await getTrustedUsers();
    const targetTrustedUser = trustedUsers.find(x => x.account.toLowerCase() === mi.author?.toLowerCase());
    const isRegistryDev = isRegistryExists && targetRegistry.isDev;
    const isTrustedUserExists = !!targetTrustedUser || isRegistryDev;
    if (!isTrustedUserExists) {
        if (IS_LIBRARY) {
            await addTrustedUser(mi.author);
        } else {
            return { ...payload, isAllOk: false };
        }
    }

    // const isTrustedUserEnabled = true || isRegistryDev; // ToDo: use targetTrustedUser.isEnabled when Trusted User (de)activation feature will be done.
    // ToDo: enable trusted user
    // if (!s.isTrustedUserEnabled) { }

    const activeModules = await getActiveModulesByHostnames(contextIds);
    const activeModule = activeModules.find(x => x.name === targetModuleId.name && x.branch === targetModuleId.branch);
    const isModuleActivated = !!activeModule;
    if (!isModuleActivated) {
        if (IS_LIBRARY) {
            await activateFeature(targetModuleId.name, targetModuleId.version, contextIds, 0, registry);
        } else {
            return { ...payload, isAllOk: false };
        }
    }

    const isModuleVersionEqual = isModuleActivated && activeModule.version === targetModuleId.version;
    if (isModuleActivated && !isModuleVersionEqual) {
        if (IS_LIBRARY) {
            await deactivateFeature(targetModuleId.name, activeModule.version, contextIds, 0, registry);
            await activateFeature(targetModuleId.name, targetModuleId.version, contextIds, 0, registry);
        } else {
            return { ...payload, isAllOk: false };
        }
    }
    
    return { ...payload, isAllOk: true };
}

// do not inject to overlays frames
if (window.name.indexOf('dapplet-overlay') === -1) {
    if (window.document.body) {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', () => init());
    }
}