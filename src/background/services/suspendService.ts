import * as Helpers from "../../common/helpers";
import SiteConfigBrowserStorage from "../browserStorages/siteConfigBrowserStorage";
import SiteConfig from "../models/siteConfig";
import GlobalConfigService from "./globalConfigService";
import * as extension from 'extensionizer';

const _siteConfigRepository = new SiteConfigBrowserStorage();
const _globalConfigService = new GlobalConfigService();

const changeIcon = () => {
    extension.tabs.query({ active: true }, async function (tab) {
        const url = tab[0].url;
        const hostname = Helpers.getHostName(url);
        const suspendityByHostname = await getSuspendityByHostname(hostname);
        const suspendityEverywhere = await getSuspendityEverywhere();

        const isSuspeded = suspendityByHostname || suspendityEverywhere;
        const path = isSuspeded
            ? "/icons/icon-grayed16.png"
            : "/icons/icon16.png";

        extension.browserAction.setIcon({ path: path });
    });
};

// TODO Errors are thrown sometimes because context menu duplication
const updateContextMenus = () => {
    extension.contextMenus.removeAll(function () {
        extension.tabs.query({ active: true }, async function (tab) {
            const url = tab[0].url;
            const hostname = Helpers.getHostName(url);

            const suspendityByHostname = await getSuspendityByHostname(hostname);

            try {
                if (suspendityByHostname) {
                    extension.contextMenus.create({
                        id: "SUSPEND_HOSTNAME",
                        title: "Resume on this site",
                        contexts: ["browser_action"],
                        onclick: async function (info, tab) {
                            await resumeByHostname(hostname);
                            updateContextMenus();
                        }
                    });
                } else {
                    extension.contextMenus.create({
                        id: "SUSPEND_HOSTNAME",
                        title: "Suspend on this site",
                        contexts: ["browser_action"],
                        onclick: async function (info, tab) {
                            await suspendByHostname(hostname);
                            updateContextMenus();
                        }
                    });
                }
            } catch (ex) {
                // TODO: fix the error of context menu
                console.warn("TODO: fix the error of context menu", ex);
            }

            const suspendityEverywhere = await getSuspendityEverywhere();

            try {
                if (suspendityEverywhere) {
                    extension.contextMenus.create({
                        id: "SUSPEND_EVERYWHERE",
                        title: "Resume on all sites",
                        contexts: ["browser_action"],
                        onclick: async function (info, tab) {
                            await resumeEverywhere();
                            updateContextMenus();
                        }
                    });
                } else {
                    extension.contextMenus.create({
                        id: "SUSPEND_EVERYWHERE",
                        title: "Suspend on all sites",
                        contexts: ["browser_action"],
                        onclick: async function (info, tab) {
                            await suspendEverywhere();
                            updateContextMenus();
                        }
                    });
                }
            } catch (ex) {
                // ToDo: fix the error of context menu
                console.warn("TODO: fix the error of context menu", ex);
            }
        });
    });
};

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

    changeIcon();
    updateContextMenus();
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

    changeIcon();
    updateContextMenus();
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

    changeIcon();
    updateContextMenus();
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

    changeIcon();
    updateContextMenus();
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
