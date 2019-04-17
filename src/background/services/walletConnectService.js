import WalletConnect from "@walletconnect/browser";

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

/**
 * Runs Dapplet inside paired wallet and returns transaction result
 * @async
 * @param {string} dappletId Dapplet ID
 * @param {object} metaTx Metadata
 * @returns {Promise<object>} Promise represents transaction result
 */
const loadDapplet = async (dappletId, metaTx) => {
  try {
    const result = await walletConnector.loadDapplet(dappletId, metaTx);
    return result;
  } catch {
    return null;
  }
};

/**
 * Returns URI of WalletConnect's session
 * @async
 * @returns {Promise<string>} Promise represents session URI
 */
const generateUri = async () => {
  await walletConnector.killSession();
  await walletConnector.createSession();
  const uri = walletConnector.uri;
  return uri;
};

/**
 * Returns connection status of WalletConnect
 * @returns {boolean} Is connected?
 */
const checkConnection = () => {
  return walletConnector.connected;
};

/**
 * Returns pairing result.
 * @async
 * @returns {Promise<object>} Promise object represents the result of WalletConnect pairing
 */
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

export  { 
  loadDapplet, 
  generateUri, 
  checkConnection, 
  waitPairing
};
