import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";

/**
 * Widget Injector
 */
const WidgetInjector = {
  _widgets: [],

  pushTransaction: async function(dappletId, metadata) {
    var backgroundFunctions = await initBGFunctions(chrome);
    const {
      loadDapplet,
      generateUri,
      checkConnection,
      waitPairing,
      transactionCreated,
      transactionRejected
    } = backgroundFunctions;

    var connected = await checkConnection();

    console.log("connected", connected);

    console.log(0);
    if (!connected) {
      console.log(1);
      var uri = await generateUri();
      console.log(2);
      console.log("uri", uri);
      console.log(3);
      WalletConnectQRCodeModal.open(uri);
      console.log(4);
      var result = await waitPairing();
      console.log(5);
      console.log("result", result);
      console.log(6);
      WalletConnectQRCodeModal.close();
      console.log(7);

      if (!result) {
        alert("Wallet paring failed");
        return;
      }
    }
    console.log(8);

    const dappletResult = await loadDapplet(dappletId, metadata);
    console.log(9);
    console.log("dappletResult", dappletResult);

    if (dappletResult) {
      transactionCreated(dappletResult);
    } else {
      transactionRejected();
    }

    return dappletResult;
  },

  init: async function() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const {
      getActiveInjectorsByHostname,
      getSuspendityByHostname,
      getSuspendityEverywhere,
      getInjectorScriptByUrl
    } = backgroundFunctions;
    var me = this;

    const hostname = window.location.hostname;

    const isBlockedEverywhere = await getSuspendityEverywhere();
    const isBlockedHostname = await getSuspendityByHostname(hostname);

    if (isBlockedEverywhere) {
      console.warn("Injecting is suspended globally at every website.");
      return;
    }

    if (isBlockedHostname) {
      console.warn("Current hostname is suspended for injecting.");
      return;
    }

    const activeInjectors = await getActiveInjectorsByHostname(hostname);

    if (
      activeInjectors == null ||
      activeInjectors == null ||
      activeInjectors.length == 0
    ) {
      console.warn("Injector: Available injectors not found");
      return;
    }

    console.log("Found active injectors for " + hostname, activeInjectors);

    for (var i = 0; i < activeInjectors.length; i++) {
      var injectorInfo = activeInjectors[i];
      if (!injectorInfo.url) continue;

      const widgetText = await getInjectorScriptByUrl(injectorInfo.url);
      // TODO: Check hash
      const widget = eval(widgetText);
      me._widgets.push(widget);
    }

    if (me._widgets.length == 0) {
      console.warn("Widget Injector: Available widgets not found");
      return;
    }

    console.log("Widget Injector: %s widget(s) was loaded", me._widgets.length);

    for (var i = 0; i < me._widgets.length; i++) {
      try {
        me._widgets[i].init(document, me.pushTransaction);
      } catch (e) {
        console.log("Widget Injector: Widget loading error", e);
      }
    }
  }
};

WidgetInjector.init();
