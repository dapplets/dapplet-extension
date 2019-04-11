import "../resources/img/icon-128.png";
import "../resources/img/icon-34.png";

import WalletConnect from "@walletconnect/browser";
import { setupMessageListener } from "chrome-extension-message-wrapper";
import Storage from "../utils/chrome-extension-storage-wrapper";

const bridge = "https://bridge.walletconnect.org";

var walletConnector;

try {
  walletConnector = new WalletConnect({ bridge });
  walletConnector.on("disconnect", (error, payload) => {
    if (error) {
      throw error;
    }

    localStorage.clear();
    console.log("wallet disconnected, localstorage cleaned"); // tslint:disable-line
  });
} catch (ex) {
  console.error(ex);
}

const checkConnection = () => {
  return walletConnector.connected;
};

const generateUri = async () => {
  await walletConnector.killSession();
  await walletConnector.createSession();
  const uri = walletConnector.uri;
  return uri;
};

const loadDapplet = async (dappletId, metaTx) => {
  try {
    const result = await walletConnector.loadDapplet(dappletId, metaTx);
    return result;
  } catch {
    return null;
  }
};

const waitPairing = () => {
  var promise = new Promise(function(resolve, reject) {
    walletConnector.on("connect", (error, payload) => {
      if (error) {
        reject(error);
      }

      resolve(true);
    });
  });

  return promise;
};

// TODO implement it
const getActiveInjectorsByHostname = async hostname => {
  return [];
};

const getInjectorsByHostname = async hostname => {
  var activeInjectors = (await Storage.getLocal("injectors/" + hostname)) || {};
  var externalInjectors = [];

  // TODO replace static json to api
  try {
    var response = await fetch("/resources/" + hostname + ".json");
    var json = await response.json();

    externalInjectors = json.data;
  } catch {
    try {
      var response = await fetch("/resources/twitter.com.json");
      var json = await response.json();

      externalInjectors = json.data;
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

chrome.runtime.onMessage.addListener(
  setupMessageListener({
    loadDapplet,
    generateUri,
    checkConnection,
    waitPairing,
    getInjectorsByHostname,
    getActiveInjectorsByHostname,
    setActiveInjector
  })
);
