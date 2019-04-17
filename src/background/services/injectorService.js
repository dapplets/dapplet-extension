import * as Cache from "./cacheService";
import Storage from "../../utils/chrome-extension-storage-wrapper";
import * as Api from "./apiService";

const getInjectorsWithIconsByHostname = async hostname => {
  const urls = await Api.getLastInjectorsByHostname(hostname);

  const injectors = await Promise.all(
    urls.map(async function(url) {
      let manifest = await Cache.getManifestByUrl(url);
      const iconPath = manifest.icons["128"];
      const iconBase64 = await Cache.getBase64FromPackage(url, iconPath);
      manifest.icons["128"] = "data:image/png;base64," + iconBase64;
      return manifest;
    })
  );

  return injectors;
};

const getInjectorScriptByUrl = async url => {
  return await Cache.getScriptByUrl(url);
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
  } catch {
    try {
      externalInjectors = await getInjectorsWithIconsByHostname("twitter.com");
    } catch {
      externalInjectors = [];
    }
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

  console.log("Injectors for " + hostname, externalInjectors);

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
