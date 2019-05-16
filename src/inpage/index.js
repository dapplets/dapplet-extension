import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";

class Core {
  openOverlay(id, ctx) {
    console.log("openOverlay", { id, ctx });
  }

  sendWalletConnectTx(tx) {
    console.log("sendWalletConnectTx", { tx });
  }
}

/**
 * Widget Injector
 */
const WidgetInjector = {
  _features: [],
  _adapters: [],

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
      getActiveFeatureIdsByHostname,
      getSuspendityByHostname,
      getSuspendityEverywhere,
      getFeatureScriptById,
      getAdapterScriptById
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

    const activeFeatureIds = await getActiveFeatureIdsByHostname(hostname);

    if (activeFeatureIds == null || activeFeatureIds.length == 0) {
      console.warn("Dapplet Injector: Available injectors not found");
      return;
    }

    console.log("Found active features for " + hostname, activeFeatureIds);

    for (const featureId of activeFeatureIds) {
      const featureText = await getFeatureScriptById(featureId);
      if (!featureText) {
        console.warn("Cannot load feature #" + featureId);
        continue;
      }
      // TODO: Check hash
      // TODO: Isolate eval here
      const Feature = eval(
        "(function(){ " + featureText + " return Feature; })();"
      );
      const adapterId =
        (Feature && Feature.REQUIRES && Feature.REQUIRES.adapter) || null;
      const canLoadFeature = false;

      // feature requires adapter and adapter is not yet loaded
      if (
        adapterId &&
        me._adapters.filter(a => a.id == adapterId).length == 0
      ) {
        const adapterText = await getAdapterScriptById(adapterId);
        if (!adapterText) {
          console.warn(`Cannot load adapter #${adapterId}. I'm skipping loading of feature #${featureId}`);
          continue;
        }
        const Adapter = eval(
          "(function(){ " + adapterText + " return ContentAdapter; })();"
        );
        me._adapters.push({
          id: adapterId,
          class: Adapter,
          instance: new Adapter()
        });
      } else {
        canLoadFeature = true;
      }

      if (canLoadFeature) {
        me._features.push({
          id: featureId,
          adapterId: adapterId,
          class: Feature,
          instance: new Feature()
        });
      }
    }

    if (me._features.length == 0) {
      console.warn("Dapplet Injector: Available features not found");
      return;
    }

    console.log(
      "Dapplet Injector: %s feature(s) was loaded",
      me._features.length
    );
    console.log(
      "Dapplet Injector: %s adapter(s) was loaded",
      me._adapters.length
    );

    const core = new Core();

    for (const adapterInfo of me._adapters) {
      adapterInfo.instance.init(core, document);
      console.log("Dapplet Injector: Adapter %s inited", adapterInfo.id);

      for (const featureInfo of me._features.filter(
        f => f.adapterId == adapterInfo.id
      )) {
        adapterInfo.instance.registerFeature(featureInfo.instance);
        console.log("Dapplet Injector: Feature %s registered", featureInfo.id);
      }
    }
  }
};

WidgetInjector.init();
