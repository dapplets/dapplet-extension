import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { initBGFunctions } from "chrome-extension-message-wrapper";

/**
* Widget Injector
*/
const WidgetInjector = {

    _widgets: [],

    pushTransaction: async function (dappletId, metadata) {
        var backgroundFunctions = await initBGFunctions(chrome);
        const { loadDapplet, generateUri, checkConnection, waitPairing } = backgroundFunctions;

        var connected = await checkConnection();

        console.log('connected', connected);

        if (!connected) {
            var uri = await generateUri();
            console.log('uri', uri);
            WalletConnectQRCodeModal.open(uri);
            var result = await waitPairing();
            console.log('result', result);
            WalletConnectQRCodeModal.close();

            if (!result) {
                alert('Wallet paring failed');
                return;
            }
        }

        var dappletResult = await loadDapplet(dappletId, metadata);
        console.log('dappletResult', dappletResult);
        return dappletResult;
    },

    init: async function () {
        var backgroundFunctions = await initBGFunctions(chrome);
        const { getActiveInjectorsByHostname, getSuspendityByHostname, getSuspendityEverywhere } = backgroundFunctions;
        var me = this;
        
        const hostname = window.location.hostname;


        const isBlockedEverywhere = await getSuspendityEverywhere();
        const isBlockedHostname = await getSuspendityByHostname(hostname);

        if (isBlockedEverywhere) {
            console.warn('Injecting is suspended globally at every website.');
            return;
        }

        if (isBlockedHostname) {
            console.warn('Current hostname is suspended for injecting.');
            return;
        }

        const activeInjectors = await getActiveInjectorsByHostname(hostname);

        if (activeInjectors == null || activeInjectors == null || activeInjectors.length == 0) {
            console.warn('Injector: Available injectors not found');
            return;
        }

        console.log('Found active injectors for ' + hostname, activeInjectors);

        for (var i = 0; i < activeInjectors.length; i++) {
            var injectorInfo = activeInjectors[i];
            if (!injectorInfo.url) continue;

            const widgetResponse = await fetch(injectorInfo.url);
            const widgetText = await widgetResponse.text();
            // TODO: Check hash
            const widget = eval(widgetText);
            me._widgets.push(widget);
        }

        if (me._widgets.length == 0) {
            console.warn('Widget Injector: Available widgets not found');
            return;
        }

        console.log('Widget Injector: %s widget(s) was loaded', me._widgets.length);

        for (var i = 0; i < me._widgets.length; i++) {
            try {
                me._widgets[i].init(document, me.pushTransaction);
            } catch (e) {
                console.log('Widget Injector: Widget loading error', e);
            }
        }
    }
}

WidgetInjector.init();