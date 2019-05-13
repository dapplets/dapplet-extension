import * as Cache from "./cacheService";
import Storage from "../../utils/chrome-extension-storage-wrapper";
import * as Api from "./apiService";

const getInjectorsWithIconsByHostname = async hostname => {
  let injectors = [
    {
      author: "Alexander Sakhaev",
      description: "Injector Development Testing",
      hasUpdate: false,
      icons: {
        "128": "data:image/png;base64,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"
      },
      id: "777",
      isActive: true,
      name: "WalletConnect Dapplet Caller",
      script: "index.js",
      url: "http://localhost:8080/main.user.js",
      version: "0.0.2"
    }
  ];

  return injectors;
};

const getInjectorScriptByUrl = async url => {
  let response = await fetch(url);
  if (!response.ok) throw new Error("Can not load local dev injector");
  const text = await response.text();
  return text;
};

/**
 * Returns activated injectors by passed hostname
 * @async
 * @param {string} hostname
 * @returns {Promise<Array<object>>} Promise represents array of objects with manifests of injectors
 */
const getActiveInjectorsByHostname = async hostname => {
  var injectors = (await Storage.getLocal("injectors/" + hostname)) || {};
  return Object.values(injectors);
};

/**
 * Returns all injectors by passed hostname with isActive and hasUpdated statuses
 * @async
 * @param {string} hostname
 * @returns {Promise<Array<object>>} Promise represents array of injector's manifests
 */
const getInjectorsByHostname = async hostname => {
  var activeInjectors = (await Storage.getLocal("injectors/" + hostname)) || {};
  var externalInjectors = [];

  try {
    externalInjectors = await getInjectorsWithIconsByHostname(hostname);
  } catch (e) {
    console.error('getInjectorsByHostname', e);
    externalInjectors = [];
  }

  for (var i = 0; i < externalInjectors.length; i++) {
    if (!externalInjectors[i]) {
      console.error("Invalid external injector");
      continue;
    }

    if (!externalInjectors[i].id) {
      console.error(
        "External injector doesn't have an id.",
        externalInjectors[i]
      );
      continue;
    }

    var matchedActiveInjector = activeInjectors[externalInjectors[i].id];

    if (matchedActiveInjector) {
      externalInjectors[i].isActive = true;

      if (!externalInjectors[i].version) {
        console.error(
          "External injector doesn't have a version.",
          externalInjectors[i]
        );
      } else {
        // TODO check correct version
        externalInjectors[i].hasUpdate =
          matchedActiveInjector.version != externalInjectors[i].version;
      }
    } else {
      externalInjectors[i].isActive = false;
      externalInjectors[i].hasUpdate = false;
    }
  }

  // TODO if an external injector doesn't exist in api, but exists in active list, then it will not be displayed at popup

  console.log("DEV Injectors for " + hostname, externalInjectors);

  return externalInjectors;
};

/**
 * Adds or remove injector to (from) activated list by passed hostname
 * @async
 * @param {object} injector Manifest of injector
 * @param {string} hostname
 * @param {boolean} isActive Add or remove?
 * @returns {Promise<void>}
 */
const setActiveInjector = async (injector, hostname, isActive) => {
  if (!injector || !injector.id) {
    throw "invalid injector";
  }

  var injectors = (await Storage.getLocal("injectors/" + hostname)) || {};

  if (isActive) {
    console.log("Adding injector to " + hostname, injector);
    injectors[injector.id] = injector;
  } else {
    console.log("Removing injector from " + hostname, injector);
    delete injectors[injector.id];
  }

  await Storage.setLocal("injectors/" + hostname, injectors);
  console.log("Active injectors for " + hostname, injectors);
};

export {
  getInjectorScriptByUrl,
  getActiveInjectorsByHostname,
  getInjectorsByHostname,
  setActiveInjector
};
