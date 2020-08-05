import * as Helpers from "../../common/helpers";
import SiteConfigBrowserStorage from "../browserStorages/siteConfigBrowserStorage";
import SiteConfig from "../models/siteConfig";
import GlobalConfigService from "./globalConfigService";
import * as extension from 'extensionizer';

const _siteConfigRepository = new SiteConfigBrowserStorage();
const _globalConfigService = new GlobalConfigService();

let lastExtensionIcon = null;

const changeIcon = () => new Promise((res, rej) => {
    extension.tabs.query({ active: true }, async function ([tab]) {
        const url = tab.url || tab.pendingUrl;
        const hostname = Helpers.getHostName(url);
        const suspendityByHostname = await getSuspendityByHostname(hostname);
        const suspendityEverywhere = await getSuspendityEverywhere();

        const isSuspeded = suspendityByHostname || suspendityEverywhere;
        const path = isSuspeded
            ? "/icons/icon-grayed16.png"
            : "/icons/icon16.png";

        if (lastExtensionIcon != path) {
            lastExtensionIcon = path;
            extension.browserAction.setIcon({ path: path });
        }

        res();
    });
});

let isContextMenusUpdating = false;
// TODO Errors are thrown sometimes because context menu duplication
const updateContextMenus = () => new Promise((res, rej) => {
    if (isContextMenusUpdating) {
        res();
        return;
    }
    isContextMenusUpdating = true;
    extension.contextMenus.removeAll(function () {
        extension.tabs.query({ active: true }, async function ([tab]) {
            const url = tab.url || tab.pendingUrl;
            const hostname = Helpers.getHostName(url);

            const suspendityByHostname = await getSuspendityByHostname(hostname);

            if (suspendityByHostname) {
                extension.contextMenus.create({
                    title: "Resume on this site",
                    contexts: ["browser_action"],
                    onclick: async function (info, tab) {
                        await resumeByHostname(hostname);
                        await updateContextMenus();
                    }
                });
            } else {
                extension.contextMenus.create({
                    title: "Suspend on this site",
                    contexts: ["browser_action"],
                    onclick: async function (info, tab) {
                        await suspendByHostname(hostname);
                        await updateContextMenus();
                    }
                });
            }

            const suspendityEverywhere = await getSuspendityEverywhere();

            if (suspendityEverywhere) {
                extension.contextMenus.create({
                    title: "Resume on all sites",
                    contexts: ["browser_action"],
                    onclick: async function (info, tab) {
                        await resumeEverywhere();
                        await updateContextMenus();
                    }
                });
            } else {
                extension.contextMenus.create({
                    title: "Suspend on all sites",
                    contexts: ["browser_action"],
                    onclick: async function (info, tab) {
                        await suspendEverywhere();
                        await updateContextMenus();
                    }
                });
            }

            isContextMenusUpdating = false;
            res();
        });
    });
})

/**
 * Suspend working of injectors by passed hostname
 * @async
 * @param {string} hostname
 * @returns {Promise<void>}
 */
const suspendByHostname = async hostname => {
    // TODO: move this logic to config service
    var config = await _siteConfigRepository.getById(hostname);
    if (!config) {
        config = new SiteConfig();
        config.hostname = hostname;
        config.paused = true;
        await _siteConfigRepository.create(config);
    } else {
        config.paused = true;
        await _siteConfigRepository.update(config);
    }

    await changeIcon();
    await updateContextMenus();
    console.log("Injecting is suspended at the " + hostname);
};

/**
 * Resume working of injectors by passed hostname
 * @async
 * @param {string} hostname
 * @returns {Promise<void>}
 */
const resumeByHostname = async hostname => {
    // TODO: move this logic to config service?
    var config = await _siteConfigRepository.getById(hostname);
    if (!config) {
        config = new SiteConfig();
        config.hostname = hostname;
        config.paused = false;
        await _siteConfigRepository.create(config);
    } else {
        config.paused = false;
        await _siteConfigRepository.update(config);
    }

    await changeIcon();
    await updateContextMenus();
    console.log("Injecting is resumed at the " + hostname);
};

/**
 * Resume suspendity (is blocked?) of passed hostname
 * @async
 * @param {string} hostname
 * @returns {Promise<boolean>}
 */
const getSuspendityByHostname = async hostname => {
    var config = await _siteConfigRepository.getById(hostname);
    return (!config) ? false : config.paused;
};

/**
 * Suspend working of injectors globally
 * @async
 * @returns {Promise<void>}
 */
const suspendEverywhere = async () => {
    const config = await _globalConfigService.get();
    config.suspended = true;
    await _globalConfigService.set(config);

    await changeIcon();
    await updateContextMenus();
    console.log("Injecting is suspended everywhere");
};

/**
 * Resume working of injectors globally
 * @async
 * @returns {Promise<void>}
 */
const resumeEverywhere = async () => {
    const config = await _globalConfigService.get();
    config.suspended = false;
    await _globalConfigService.set(config);

    await changeIcon();
    await updateContextMenus();
    console.log("Injecting is resumed everywhere");
};

/**
 * Resume suspendity (is blocked?) of injectors globally
 * @async
 * @returns {Promise<boolean>}
 */
const getSuspendityEverywhere = async () => {
    const { suspended } = await _globalConfigService.get();
    return suspended;
};

export {
    changeIcon,
    updateContextMenus,
    getSuspendityByHostname,
    getSuspendityEverywhere,
    suspendByHostname,
    suspendEverywhere,
    resumeByHostname,
    resumeEverywhere
};
